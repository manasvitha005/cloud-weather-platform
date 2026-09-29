export interface OpenMeteoCurrentWeather {
  time: string;
  interval: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  weather_code: number;
  surface_pressure?: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  uv_index?: number;
  visibility?: number;
}

export interface OpenMeteoHourlyWeather {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  apparent_temperature: number[];
  precipitation: number[];
  weather_code: number[];
  surface_pressure?: number[];
  wind_speed_10m: number[];
  wind_direction_10m?: number[];
  uv_index?: number[];
  visibility?: number[];
}

export interface OpenMeteoDailyWeather {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max?: number[];
  apparent_temperature_min?: number[];
  precipitation_sum: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max: number[];
  wind_direction_10m_dominant?: number[];
  uv_index_max?: number[];
}

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current?: OpenMeteoCurrentWeather;
  hourly?: OpenMeteoHourlyWeather;
  daily?: OpenMeteoDailyWeather;
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  country: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
  population?: number;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
  generationtime_ms?: number;
}

export interface NormalizedCurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number | null;
  precipitation: number;
  pressure: number | null;
  weatherCode: number;
  conditionText: string;
  isDay: boolean;
  uvIndex: number | null;
  visibility: number | null;
  timestamp: string;
}

export interface NormalizedHourlyPoint {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  conditionText: string;
  uvIndex?: number;
  pressure?: number;
}

export interface NormalizedDailyForecast {
  date: string;
  dayName: string;
  weatherCode: number;
  conditionText: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  precipitationSum: number;
  windSpeedMax: number;
  uvIndexMax?: number;
}

export interface FullWeatherResponse {
  location: {
    id: string;
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
    elevation?: number | null;
    isActive: boolean;
    lastSyncedAt?: string | null;
  };
  current: NormalizedCurrentWeather;
  hourly: NormalizedHourlyPoint[];
  daily: NormalizedDailyForecast[];
  isRealtimeFresh?: boolean;
}
