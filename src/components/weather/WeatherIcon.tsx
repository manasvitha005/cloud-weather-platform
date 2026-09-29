import React from 'react';
import {
  Sun,
  SunDim,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Moon,
  CloudMoon,
  LucideProps,
} from 'lucide-react';
import { getWMODetails } from '@/services/weather/wmo-codes';

interface WeatherIconProps extends LucideProps {
  weatherCode: number;
  isDay?: boolean;
}

export function WeatherIcon({ weatherCode, isDay = true, className, ...props }: WeatherIconProps) {
  const info = getWMODetails(weatherCode);

  if (!isDay) {
    if (weatherCode <= 1) {
      return <Moon className={className || 'w-6 h-6 text-indigo-300'} {...props} />;
    }
    if (weatherCode <= 3) {
      return <CloudMoon className={className || 'w-6 h-6 text-indigo-200'} {...props} />;
    }
  }

  switch (info.category) {
    case 'clear':
      return weatherCode === 0 ? (
        <Sun className={className || 'w-6 h-6 text-amber-400'} {...props} />
      ) : (
        <SunDim className={className || 'w-6 h-6 text-amber-300'} {...props} />
      );

    case 'cloudy':
      return weatherCode === 2 ? (
        <CloudSun className={className || 'w-6 h-6 text-sky-300'} {...props} />
      ) : (
        <Cloud className={className || 'w-6 h-6 text-slate-400'} {...props} />
      );

    case 'fog':
      return <CloudFog className={className || 'w-6 h-6 text-slate-400'} {...props} />;

    case 'drizzle':
      return <CloudDrizzle className={className || 'w-6 h-6 text-cyan-400'} {...props} />;

    case 'rain':
      return <CloudRain className={className || 'w-6 h-6 text-blue-400'} {...props} />;

    case 'snow':
      return <CloudSnow className={className || 'w-6 h-6 text-indigo-200'} {...props} />;

    case 'thunderstorm':
      return <CloudLightning className={className || 'w-6 h-6 text-amber-400'} {...props} />;

    default:
      return <Cloud className={className || 'w-6 h-6 text-slate-400'} {...props} />;
  }
}
