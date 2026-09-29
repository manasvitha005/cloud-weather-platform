import { describe, it, expect } from 'vitest';
import { WeatherService } from '@/services/weather/open-meteo';
import { getWMODetails, getWeatherThemeClass } from '@/services/weather/wmo-codes';

describe('WMO Codes Service', () => {
  it('correctly maps clear sky code 0', () => {
    const info = getWMODetails(0);
    expect(info.description).toBe('Clear sky');
    expect(info.category).toBe('clear');
  });

  it('correctly maps heavy rain code 65', () => {
    const info = getWMODetails(65);
    expect(info.description).toBe('Heavy rain');
    expect(info.category).toBe('rain');
  });

  it('correctly returns night theme when isDay is false', () => {
    const theme = getWeatherThemeClass(0, false);
    expect(theme).toContain('bg-weather-night');
  });
});

describe('WeatherService Normalization', () => {
  it('normalizes raw Open-Meteo current weather payload correctly', () => {
    const raw = {
      time: '2026-09-29T12:00',
      interval: 900,
      temperature_2m: 28.5,
      relative_humidity_2m: 65,
      apparent_temperature: 30.2,
      is_day: 1,
      precipitation: 0.0,
      weather_code: 1,
      surface_pressure: 1012.4,
      wind_speed_10m: 14.2,
      wind_direction_10m: 180,
      uv_index: 6.2,
      visibility: 10000,
    };

    const normalized = WeatherService.normalizeCurrent(raw);
    expect(normalized.temperature).toBe(28.5);
    expect(normalized.feelsLike).toBe(30.2);
    expect(normalized.humidity).toBe(65);
    expect(normalized.windSpeed).toBe(14.2);
    expect(normalized.windDirection).toBe(180);
    expect(normalized.conditionText).toBe('Mainly clear');
    expect(normalized.visibility).toBe(10); // converted to km
  });

  it('normalizes hourly weather arrays', () => {
    const rawHourly = {
      time: ['2026-09-29T12:00', '2026-09-29T13:00'],
      temperature_2m: [25.0, 26.5],
      relative_humidity_2m: [60, 55],
      apparent_temperature: [26.0, 27.5],
      precipitation: [0, 1.2],
      weather_code: [0, 61],
      wind_speed_10m: [10, 12],
    };

    const hourly = WeatherService.normalizeHourly(rawHourly, 2);
    expect(hourly).toHaveLength(2);
    expect(hourly[0].temperature).toBe(25.0);
    expect(hourly[1].precipitation).toBe(1.2);
    expect(hourly[1].conditionText).toBe('Slight rain');
  });
});
