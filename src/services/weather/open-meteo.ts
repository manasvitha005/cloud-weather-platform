import { z } from 'zod';
import {
  OpenMeteoForecastResponse,
  GeocodingResponse,
  NormalizedCurrentWeather,
  NormalizedHourlyPoint,
  NormalizedDailyForecast,
} from '@/types/weather';
import { getWMODetails } from './wmo-codes';

const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Zod schemas for validation
const CurrentWeatherSchema = z.object({
  time: z.string(),
  temperature_2m: z.number(),
  relative_humidity_2m: z.number(),
  apparent_temperature: z.number(),
  precipitation: z.number().default(0),
  weather_code: z.number(),
  surface_pressure: z.number().optional().nullable(),
  wind_speed_10m: z.number(),
  wind_direction_10m: z.number().optional().nullable(),
  uv_index: z.number().optional().nullable(),
  visibility: z.number().optional().nullable(),
  is_day: z.number().optional().default(1),
});

export class WeatherService {
  /**
   * Search for locations using Open-Meteo Geocoding API
   */
  public static async searchLocations(query: string, count: number = 5): Promise<GeocodingResponse> {
    if (!query || query.trim().length < 2) {
      return { results: [] };
    }

    const url = new URL(OPEN_METEO_GEOCODING_URL);
    url.searchParams.set('name', query.trim());
    url.searchParams.set('count', count.toString());
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    try {
      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'CloudWeatherPlatform/1.0' },
        next: { revalidate: 3600 }, // Cache geocoding for 1h
      });

      if (!res.ok) {
        throw new Error(`Geocoding API responded with HTTP status ${res.status}`);
      }

      const data = (await res.json()) as GeocodingResponse;
      return data;
    } catch (err: unknown) {
      console.error('[WeatherService.searchLocations] Error:', err);
      throw new Error(`Failed to search location: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch current and forecast weather for coordinates
   */
  public static async fetchForecast(
    lat: number,
    lon: number,
    timezone: string = 'auto'
  ): Promise<{ data: OpenMeteoForecastResponse; latencyMs: number }> {
    const startTime = Date.now();
    const url = new URL(OPEN_METEO_FORECAST_URL);
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lon.toString());
    url.searchParams.set(
      'current',
      [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'is_day',
        'precipitation',
        'weather_code',
        'surface_pressure',
        'wind_speed_10m',
        'wind_direction_10m',
        'uv_index',
        'visibility',
      ].join(',')
    );
    url.searchParams.set(
      'hourly',
      [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation',
        'weather_code',
        'surface_pressure',
        'wind_speed_10m',
        'wind_direction_10m',
        'uv_index',
      ].join(',')
    );
    url.searchParams.set(
      'daily',
      [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'apparent_temperature_max',
        'apparent_temperature_min',
        'precipitation_sum',
        'precipitation_probability_max',
        'wind_speed_10m_max',
        'wind_direction_10m_dominant',
        'uv_index_max',
      ].join(',')
    );
    url.searchParams.set('timezone', timezone || 'auto');
    url.searchParams.set('forecast_days', '7');

    try {
      const res = await fetch(url.toString(), {
        cache: 'no-store', // Always fresh for ingestion/monitoring
        headers: { 'User-Agent': 'CloudWeatherPlatform/1.0' },
      });

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        throw new Error(`Open-Meteo API failed with status ${res.status}: ${res.statusText}`);
      }

      const raw = await res.json();
      return { data: raw as OpenMeteoForecastResponse, latencyMs };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      console.error(`[WeatherService.fetchForecast] Error fetching weather for (${lat}, ${lon}):`, err);
      throw new Error(`Weather fetch failed (${latencyMs}ms): ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Normalize raw current weather payload
   */
  public static normalizeCurrent(rawCurrent: unknown): NormalizedCurrentWeather {
    const validated = CurrentWeatherSchema.parse(rawCurrent);
    const wmo = getWMODetails(validated.weather_code);

    return {
      temperature: validated.temperature_2m,
      feelsLike: validated.apparent_temperature,
      humidity: validated.relative_humidity_2m,
      windSpeed: validated.wind_speed_10m,
      windDirection: validated.wind_direction_10m ?? null,
      precipitation: validated.precipitation,
      pressure: validated.surface_pressure ?? null,
      weatherCode: validated.weather_code,
      conditionText: wmo.description,
      isDay: validated.is_day === 1,
      uvIndex: validated.uv_index ?? null,
      visibility: validated.visibility ? validated.visibility / 1000 : null, // convert m to km
      timestamp: validated.time,
    };
  }

  /**
   * Normalize hourly forecasts (next 24-48 hours)
   */
  public static normalizeHourly(hourly?: OpenMeteoForecastResponse['hourly'], maxPoints: number = 24): NormalizedHourlyPoint[] {
    if (!hourly || !hourly.time || hourly.time.length === 0) return [];

    const points: NormalizedHourlyPoint[] = [];
    const limit = Math.min(hourly.time.length, maxPoints);

    for (let i = 0; i < limit; i++) {
      const code = hourly.weather_code[i] ?? 0;
      points.push({
        time: hourly.time[i],
        temperature: hourly.temperature_2m[i] ?? 0,
        feelsLike: hourly.apparent_temperature[i] ?? hourly.temperature_2m[i] ?? 0,
        humidity: hourly.relative_humidity_2m[i] ?? 0,
        precipitation: hourly.precipitation[i] ?? 0,
        windSpeed: hourly.wind_speed_10m[i] ?? 0,
        weatherCode: code,
        conditionText: getWMODetails(code).description,
        uvIndex: hourly.uv_index?.[i],
        pressure: hourly.surface_pressure?.[i],
      });
    }

    return points;
  }

  /**
   * Normalize 7-day daily forecasts
   */
  public static normalizeDaily(daily?: OpenMeteoForecastResponse['daily']): NormalizedDailyForecast[] {
    if (!daily || !daily.time || daily.time.length === 0) return [];

    const days: NormalizedDailyForecast[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < daily.time.length; i++) {
      const dateStr = daily.time[i];
      const dateObj = new Date(dateStr);
      const dayName = isNaN(dateObj.getTime()) ? 'Day' : dayNames[dateObj.getDay()];
      const code = daily.weather_code[i] ?? 0;

      days.push({
        date: dateStr,
        dayName,
        weatherCode: code,
        conditionText: getWMODetails(code).description,
        tempMax: daily.temperature_2m_max[i] ?? 0,
        tempMin: daily.temperature_2m_min[i] ?? 0,
        precipitationProbability: daily.precipitation_probability_max?.[i] ?? 0,
        precipitationSum: daily.precipitation_sum[i] ?? 0,
        windSpeedMax: daily.wind_speed_10m_max[i] ?? 0,
        uvIndexMax: daily.uv_index_max?.[i],
      });
    }

    return days;
  }
}
