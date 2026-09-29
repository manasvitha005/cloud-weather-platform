import { NextRequest, NextResponse } from 'next/server';
import { WeatherService } from '@/services/weather/open-meteo';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const data = await WeatherService.searchLocations(query, limit);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('[GET /api/geocoding] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Geocoding search failed' },
      { status: 500 }
    );
  }
}
