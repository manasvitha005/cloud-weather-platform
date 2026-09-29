import { prisma } from '../src/lib/prisma';
import { getWMODetails } from '../src/services/weather/wmo-codes';

const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

async function backfill() {
  console.log('⏳ Fetching genuine past 7-day hourly observations from Open-Meteo API...');

  const locations = await prisma.location.findMany({
    where: { isActive: true },
  });

  for (const loc of locations) {
    console.log(`Ingesting past 7 days for ${loc.name}, ${loc.country}...`);

    const url = new URL(OPEN_METEO_FORECAST_URL);
    url.searchParams.set('latitude', loc.latitude.toString());
    url.searchParams.set('longitude', loc.longitude.toString());
    url.searchParams.set('past_days', '7');
    url.searchParams.set('forecast_days', '1');
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

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        console.warn(`Failed fetching past data for ${loc.name}`);
        continue;
      }

      const data = await res.json();
      const hourly = data.hourly;

      if (!hourly || !hourly.time) continue;

      let count = 0;
      for (let i = 0; i < hourly.time.length; i++) {
        const recordedAt = new Date(hourly.time[i]);
        const temp = hourly.temperature_2m[i];
        const feels = hourly.apparent_temperature[i] ?? temp;
        const humid = hourly.relative_humidity_2m[i];
        const wind = hourly.wind_speed_10m[i];
        const windDir = hourly.wind_direction_10m?.[i] ?? null;
        const precip = hourly.precipitation[i] ?? 0;
        const press = hourly.surface_pressure?.[i] ?? null;
        const code = hourly.weather_code[i] ?? 0;
        const uv = hourly.uv_index?.[i] ?? null;

        const wmo = getWMODetails(code);

        // Upsert observation
        await prisma.weatherRecord.upsert({
          where: {
            locationId_recordedAt: {
              locationId: loc.id,
              recordedAt,
            },
          },
          update: {
            temperature: temp,
            feelsLikeTemperature: feels,
            humidity: humid,
            windSpeed: wind,
            windDirection: windDir,
            precipitation: precip,
            pressure: press,
            weatherCode: code,
            conditionText: wmo.description,
            uvIndex: uv,
          },
          create: {
            locationId: loc.id,
            recordedAt,
            temperature: temp,
            feelsLikeTemperature: feels,
            humidity: humid,
            windSpeed: wind,
            windDirection: windDir,
            precipitation: precip,
            pressure: press,
            weatherCode: code,
            conditionText: wmo.description,
            uvIndex: uv,
          },
        });
        count++;
      }

      console.log(`✓ Stored ${count} genuine hourly historical observations for ${loc.name}`);
    } catch (err) {
      console.error(`Error backfilling ${loc.name}:`, err);
    }
  }

  console.log('✅ Backfill complete! Historical analytics datasets are now fully hydrated.');
}

backfill()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
