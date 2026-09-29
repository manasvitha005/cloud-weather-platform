import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WeatherService } from '@/services/weather/open-meteo';
import { AlertEngine } from '@/services/alerts/alert-engine';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  country: z.string().min(1, 'Country is required').max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().optional().default('UTC'),
  elevation: z.number().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' },
      include: {
        weatherRecords: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        weatherAlerts: {
          where: { status: 'ACTIVE' },
        },
        _count: {
          select: { weatherRecords: true },
        },
      },
    });

    const formatted = locations.map((loc) => {
      const latest = loc.weatherRecords[0] || null;
      return {
        id: loc.id,
        name: loc.name,
        country: loc.country,
        latitude: loc.latitude,
        longitude: loc.longitude,
        timezone: loc.timezone,
        elevation: loc.elevation,
        isActive: loc.isActive,
        createdAt: loc.createdAt.toISOString(),
        updatedAt: loc.updatedAt.toISOString(),
        totalRecords: loc._count.weatherRecords,
        activeAlertsCount: loc.weatherAlerts.length,
        latestObservation: latest
          ? {
              temperature: latest.temperature,
              feelsLike: latest.feelsLikeTemperature,
              humidity: latest.humidity,
              windSpeed: latest.windSpeed,
              precipitation: latest.precipitation,
              weatherCode: latest.weatherCode,
              conditionText: latest.conditionText,
              recordedAt: latest.recordedAt.toISOString(),
            }
          : null,
      };
    });

    return NextResponse.json({ locations: formatted });
  } catch (error: unknown) {
    console.error('[GET /api/locations] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateLocationSchema.parse(body);

    // Check if location coordinates already exist
    const existing = await prisma.location.findFirst({
      where: {
        latitude: { gte: validated.latitude - 0.01, lte: validated.latitude + 0.01 },
        longitude: { gte: validated.longitude - 0.01, lte: validated.longitude + 0.01 },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Location "${existing.name}" with similar coordinates is already being monitored.` },
        { status: 409 }
      );
    }

    // Create location
    const newLocation = await prisma.location.create({
      data: validated,
    });

    // Automatically perform initial weather ingestion for this newly added location
    try {
      const { data: forecast } = await WeatherService.fetchForecast(
        newLocation.latitude,
        newLocation.longitude,
        newLocation.timezone
      );

      if (forecast.current) {
        const norm = WeatherService.normalizeCurrent(forecast.current);
        const record = await prisma.weatherRecord.create({
          data: {
            locationId: newLocation.id,
            recordedAt: new Date(norm.timestamp),
            temperature: norm.temperature,
            feelsLikeTemperature: norm.feelsLike,
            humidity: norm.humidity,
            windSpeed: norm.windSpeed,
            windDirection: norm.windDirection,
            precipitation: norm.precipitation,
            pressure: norm.pressure,
            weatherCode: norm.weatherCode,
            conditionText: norm.conditionText,
            uvIndex: norm.uvIndex,
            visibility: norm.visibility,
          },
        });

        // Run alert engine on initial record
        await AlertEngine.evaluateWeatherRecord(newLocation, record);
      }
    } catch (ingestErr) {
      console.warn(`[POST /api/locations] Immediate weather ingestion note for ${newLocation.name}:`, ingestErr);
    }

    return NextResponse.json(newLocation, { status: 201 });
  } catch (error: unknown) {
    console.error('[POST /api/locations] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create location' },
      { status: 500 }
    );
  }
}
