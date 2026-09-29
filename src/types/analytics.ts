export type TimeRange = '24h' | '7d' | '30d';

export interface AnalyticsMetricSummary {
  avg: number;
  min: number;
  max: number;
  current: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // percentage change vs preceding window
}

export interface AnalyticsDataPoint {
  timestamp: string;
  formattedTime: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  pressure?: number | null;
}

export interface LocationAnalyticsResponse {
  location: {
    id: string;
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  timeRange: TimeRange;
  totalObservations: number;
  periodStart: string;
  periodEnd: string;
  metrics: {
    temperature: AnalyticsMetricSummary;
    humidity: AnalyticsMetricSummary;
    windSpeed: AnalyticsMetricSummary;
    precipitation: {
      total: number;
      maxHourly: number;
      rainyHours: number;
    };
  };
  series: AnalyticsDataPoint[];
  hasSufficientData: boolean;
}
