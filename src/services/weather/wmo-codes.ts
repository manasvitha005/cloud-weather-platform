export interface WMOInfo {
  code: number;
  description: string;
  category: 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm';
  icon: string;
}

export const WMO_CODE_MAP: Record<number, WMOInfo> = {
  0: { code: 0, description: 'Clear sky', category: 'clear', icon: 'Sun' },
  1: { code: 1, description: 'Mainly clear', category: 'clear', icon: 'SunDim' },
  2: { code: 2, description: 'Partly cloudy', category: 'cloudy', icon: 'CloudSun' },
  3: { code: 3, description: 'Overcast', category: 'cloudy', icon: 'Cloud' },
  45: { code: 45, description: 'Fog', category: 'fog', icon: 'CloudFog' },
  48: { code: 48, description: 'Depositing rime fog', category: 'fog', icon: 'CloudFog' },
  51: { code: 51, description: 'Light drizzle', category: 'drizzle', icon: 'CloudDrizzle' },
  53: { code: 53, description: 'Moderate drizzle', category: 'drizzle', icon: 'CloudDrizzle' },
  55: { code: 55, description: 'Dense drizzle', category: 'drizzle', icon: 'CloudDrizzle' },
  56: { code: 56, description: 'Light freezing drizzle', category: 'drizzle', icon: 'CloudSnow' },
  57: { code: 57, description: 'Dense freezing drizzle', category: 'drizzle', icon: 'CloudSnow' },
  61: { code: 61, description: 'Slight rain', category: 'rain', icon: 'CloudRain' },
  63: { code: 63, description: 'Moderate rain', category: 'rain', icon: 'CloudRain' },
  65: { code: 65, description: 'Heavy rain', category: 'rain', icon: 'CloudRain' },
  66: { code: 66, description: 'Light freezing rain', category: 'rain', icon: 'CloudRain' },
  67: { code: 67, description: 'Heavy freezing rain', category: 'rain', icon: 'CloudRain' },
  71: { code: 71, description: 'Slight snow fall', category: 'snow', icon: 'CloudSnow' },
  73: { code: 73, description: 'Moderate snow fall', category: 'snow', icon: 'CloudSnow' },
  75: { code: 75, description: 'Heavy snow fall', category: 'snow', icon: 'CloudSnow' },
  77: { code: 77, description: 'Snow grains', category: 'snow', icon: 'CloudSnow' },
  80: { code: 80, description: 'Slight rain showers', category: 'rain', icon: 'CloudRain' },
  81: { code: 81, description: 'Moderate rain showers', category: 'rain', icon: 'CloudRain' },
  82: { code: 82, description: 'Violent rain showers', category: 'rain', icon: 'CloudLightning' },
  85: { code: 85, description: 'Slight snow showers', category: 'snow', icon: 'CloudSnow' },
  86: { code: 86, description: 'Heavy snow showers', category: 'snow', icon: 'CloudSnow' },
  95: { code: 95, description: 'Thunderstorm', category: 'thunderstorm', icon: 'CloudLightning' },
  96: { code: 96, description: 'Thunderstorm with slight hail', category: 'thunderstorm', icon: 'CloudLightning' },
  99: { code: 99, description: 'Thunderstorm with heavy hail', category: 'thunderstorm', icon: 'CloudLightning' },
};

export function getWMODetails(code: number): WMOInfo {
  return (
    WMO_CODE_MAP[code] || {
      code,
      description: 'Unknown weather',
      category: 'cloudy',
      icon: 'Cloud',
    }
  );
}

export function getWeatherThemeClass(code: number, isDay: boolean = true): string {
  if (!isDay) return 'bg-weather-night text-white';
  const info = getWMODetails(code);
  switch (info.category) {
    case 'clear':
      return 'bg-weather-clear text-slate-900 dark:text-white';
    case 'cloudy':
    case 'fog':
      return 'bg-weather-cloudy text-slate-900 dark:text-white';
    case 'drizzle':
    case 'rain':
      return 'bg-weather-rain text-slate-900 dark:text-white';
    case 'thunderstorm':
      return 'bg-weather-storm text-white';
    case 'snow':
      return 'bg-gradient-to-br from-blue-100/20 to-slate-200/20 text-slate-900 dark:text-white';
    default:
      return 'bg-weather-cloudy text-slate-900 dark:text-white';
  }
}
