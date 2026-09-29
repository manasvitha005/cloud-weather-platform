import { prisma } from '@/lib/prisma';
import { LocationAnalyticsResponse, TimeRange, AnalyticsDataPoint, AnalyticsMetricSummary } from '@/types/analytics';
import { subHours, subDays, format } from 'date-fns';

export class AnalyticsService {
  /**
   * Compute comprehensive historical analytics for a given location and time window
   */
  public static async getLocationAnalytics(
    locationId: string,
    range: TimeRange = '24h'
  ): Promise<LocationAnalyticsResponse | null> {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return null;
    }

    const now = new Date();
    let startDate: Date;
    let formatPattern: string;

    switch (range) {
      case '24h':
        startDate = subHours(now, 24);
        formatPattern = 'HH:mm';
        break;
      case '7d':
        startDate = subDays(now, 7);
        formatPattern = 'MMM dd, HH:mm';
        break;
      case '30d':
        startDate = subDays(now, 30);
        formatPattern = 'MMM dd';
        break;
      default:
        startDate = subHours(now, 24);
        formatPattern = 'HH:mm';
    }

    // Query historical records ordered chronologically
    const records = await prisma.weatherRecord.findMany({
      where: {
        locationId: location.id,
        recordedAt: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: {
        recordedAt: 'asc',
      },
    });

    if (records.length === 0) {
      return {
        location: {
          id: location.id,
          name: location.name,
          country: location.country,
          latitude: location.latitude,
          longitude: location.longitude,
        },
        timeRange: range,
        totalObservations: 0,
        periodStart: startDate.toISOString(),
        periodEnd: now.toISOString(),
        metrics: {
          temperature: { avg: 0, min: 0, max: 0, current: 0, trend: 'stable', changeRate: 0 },
          humidity: { avg: 0, min: 0, max: 0, current: 0, trend: 'stable', changeRate: 0 },
          windSpeed: { avg: 0, min: 0, max: 0, current: 0, trend: 'stable', changeRate: 0 },
          precipitation: { total: 0, maxHourly: 0, rainyHours: 0 },
        },
        series: [],
        hasSufficientData: false,
      };
    }

    // Map series
    const series: AnalyticsDataPoint[] = records.map((r) => ({
      timestamp: r.recordedAt.toISOString(),
      formattedTime: format(r.recordedAt, formatPattern),
      temperature: Number(r.temperature.toFixed(1)),
      feelsLike: Number(r.feelsLikeTemperature.toFixed(1)),
      humidity: Number(r.humidity.toFixed(1)),
      windSpeed: Number(r.windSpeed.toFixed(1)),
      precipitation: Number(r.precipitation.toFixed(2)),
      pressure: r.pressure ? Number(r.pressure.toFixed(1)) : null,
    }));

    // Calculate metrics
    const temps = records.map((r) => r.temperature);
    const humids = records.map((r) => r.humidity);
    const winds = records.map((r) => r.windSpeed);
    const precips = records.map((r) => r.precipitation);

    const tempSummary = this.calculateSummary(temps);
    const humidSummary = this.calculateSummary(humids);
    const windSummary = this.calculateSummary(winds);

    const totalPrecip = precips.reduce((sum, val) => sum + val, 0);
    const maxPrecip = precips.length > 0 ? Math.max(...precips) : 0;
    const rainyHours = precips.filter((p) => p > 0.1).length;

    return {
      location: {
        id: location.id,
        name: location.name,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
      },
      timeRange: range,
      totalObservations: records.length,
      periodStart: startDate.toISOString(),
      periodEnd: now.toISOString(),
      metrics: {
        temperature: tempSummary,
        humidity: humidSummary,
        windSpeed: windSummary,
        precipitation: {
          total: Number(totalPrecip.toFixed(1)),
          maxHourly: Number(maxPrecip.toFixed(1)),
          rainyHours,
        },
      },
      series,
      hasSufficientData: records.length >= 1,
    };
  }

  private static calculateSummary(values: number[]): AnalyticsMetricSummary {
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, current: 0, trend: 'stable', changeRate: 0 };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = Number((sum / values.length).toFixed(1));
    const current = Number(values[values.length - 1].toFixed(1));

    // Trend calculation
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let changeRate = 0;

    if (values.length >= 2) {
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      const diff = secondAvg - firstAvg;
      if (firstAvg !== 0) {
        changeRate = Number(((diff / Math.abs(firstAvg)) * 100).toFixed(1));
      }

      if (diff > 0.5) trend = 'increasing';
      else if (diff < -0.5) trend = 'decreasing';
      else trend = 'stable';
    }

    return {
      avg,
      min: Number(min.toFixed(1)),
      max: Number(max.toFixed(1)),
      current,
      trend,
      changeRate,
    };
  }
}
