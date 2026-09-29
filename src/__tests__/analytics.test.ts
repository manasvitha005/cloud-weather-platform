import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { AnalyticsService } from '@/services/analytics/analytics-service';

describe('AnalyticsService Integration Tests', () => {
  let testLoc: any;

  beforeAll(async () => {
    testLoc = await prisma.location.upsert({
      where: { latitude_longitude: { latitude: 88.8, longitude: 88.8 } },
      update: {},
      create: {
        name: 'Analytics Test City',
        country: 'Testland',
        latitude: 88.8,
        longitude: 88.8,
        timezone: 'UTC',
      },
    });

    const now = new Date();
    // Insert 5 test observations spaced by 1 hour
    for (let i = 0; i < 5; i++) {
      const recordedAt = new Date(now.getTime() - i * 3600 * 1000);
      await prisma.weatherRecord.create({
        data: {
          locationId: testLoc.id,
          recordedAt,
          temperature: 20 + i * 2, // 20, 22, 24, 26, 28
          feelsLikeTemperature: 21 + i * 2,
          humidity: 50 + i * 5,
          windSpeed: 10 + i,
          precipitation: i === 1 ? 2.5 : 0.0,
          weatherCode: 0,
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.weatherRecord.deleteMany({ where: { locationId: testLoc.id } });
    await prisma.location.delete({ where: { id: testLoc.id } });
  });

  it('aggregates average, min, and max temperature correctly for 24h', async () => {
    const analytics = await AnalyticsService.getLocationAnalytics(testLoc.id, '24h');
    expect(analytics).toBeDefined();
    expect(analytics?.totalObservations).toBe(5);
    expect(analytics?.hasSufficientData).toBe(true);

    expect(analytics?.metrics.temperature.min).toBe(20.0);
    expect(analytics?.metrics.temperature.max).toBe(28.0);
    expect(analytics?.metrics.temperature.avg).toBe(24.0);
    expect(analytics?.metrics.precipitation.total).toBe(2.5);
    expect(analytics?.series).toHaveLength(5);
  });

  it('handles non-existent location gracefully', async () => {
    const result = await AnalyticsService.getLocationAnalytics('non-existent-id', '24h');
    expect(result).toBeNull();
  });
});
