import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCelsius(temp: number | null | undefined): string {
  if (temp === null || temp === undefined || isNaN(temp)) return '--°C';
  return `${Math.round(temp)}°C`;
}

export function formatPreciseTemp(temp: number | null | undefined): string {
  if (temp === null || temp === undefined || isNaN(temp)) return '--°C';
  return `${temp.toFixed(1)}°C`;
}

export function formatHumidity(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '--%';
  return `${Math.round(val)}%`;
}

export function formatWindSpeed(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '-- km/h';
  return `${val.toFixed(1)} km/h`;
}

export function formatPrecipitation(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0 mm';
  return `${val.toFixed(1)} mm`;
}

export function formatPressure(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '-- hPa';
  return `${Math.round(val)} hPa`;
}

export function getWindDirectionCard(degrees: number | null | undefined): string {
  if (degrees === null || degrees === undefined) return 'N/A';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return directions[index];
}

export function getUVLevel(uv: number | null | undefined): { label: string; color: string } {
  if (uv === null || uv === undefined) return { label: 'Low', color: 'text-emerald-400' };
  if (uv <= 2) return { label: 'Low', color: 'text-emerald-400' };
  if (uv <= 5) return { label: 'Moderate', color: 'text-amber-400' };
  if (uv <= 7) return { label: 'High', color: 'text-orange-500' };
  if (uv <= 10) return { label: 'Very High', color: 'text-rose-500' };
  return { label: 'Extreme', color: 'text-purple-500' };
}
