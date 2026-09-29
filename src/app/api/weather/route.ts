import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WeatherService } from '@/services/weather/open-meteo';
import { FullWeatherResponse } from '@/types/weather';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');

    let location;

    if (locationId) {
      location = await prisma.location.findUnique({
        where: { id: locationId },
        include: {
          weatherRecords: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
          },
        },
      });
    } else if (latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);
      if (!isNaN(lat) && !isNaN(lon)) {
        location = await prisma.location.findFirst({
          where: {
            latitude: { gte: lat - 0.05, lte: lat + 0.05 },
            longitude: { gte: lon - 0.05, lte: lon + 0.05 },
          },
          include: {
            weatherRecords: {
              orderBy: { recordedAt: 'desc' },
              take: 1,
            },
          },
        });
      }
    }

    if (!location) {
      // Default to first active location if none specified
      location = await prisma.location.findFirst({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: {
          weatherRecords: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
          },
        },
      });
    }

    if (!location) {
      return NextResponse.json(
        { error: 'No monitored locations found in the system.' },
        { status: 404 }
      );
    }

    // Fetch live forecast from Open-Meteo
    const { data: forecastData } = await WeatherService.fetchForecast(
      location.latitude,
      location.longitude,
      location.timezone
    );

    if (!forecastData.current) {
      return NextResponse.json(
        { error: 'Weather provider returned incomplete data.' },
        { status: 502 }
      );
    }

    const normalizedCurrent = WeatherService.normalizeCurrent(forecastData.current);
    const normalizedHourly = WeatherService.normalizeHourly(forecastData.hourly, 24);
    const normalizedDaily = WeatherService.normalizeDaily(forecastData.daily);

    const latestRecord = location.weatherRecords[0];

    const response: FullWeatherResponse = {
      location: {
        id: location.id,
        name: location.name,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
        elevation: location.elevation,
        isActive: location.isActive,
        lastSyncedAt: latestRecord ? latestRecord.recordedAt.toISOString() : null,
      },
      current: normalizedCurrent,
      hourly: normalizedHourly,
      daily: normalizedDaily,
      isRealtimeFresh: true,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('[GET /api/weather] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
