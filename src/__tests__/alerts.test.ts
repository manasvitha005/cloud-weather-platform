import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { AlertEngine } from '@/services/alerts/alert-engine';

describe('AlertEngine Unit & Integration Tests', () => {
  let testLocation: any;

  beforeAll(async () => {
    // Create test location
    testLocation = await prisma.location.upsert({
      where: { latitude_longitude: { latitude: 99.1, longitude: 99.1 } },
      update: {},
      create: {
        name: 'Test Alert City',
        country: 'Testland',
        latitude: 99.1,
        longitude: 99.1,
        timezone: 'UTC',
      },
    });

    // Ensure test rule exists: High Temp > 38.0
    await prisma.alertRule.upsert({
      where: { id: 'test-rule-temp' },
      update: { threshold: 38.0, isEnabled: true },
      create: {
        id: 'test-rule-temp',
        metric: 'TEMPERATURE_HIGH',
        threshold: 38.0,
        severity: 'CRITICAL',
        title: 'High Heat Test',
        description: 'Test rule for temperature alert',
        isEnabled: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.weatherAlert.deleteMany({ where: { locationId: testLocation.id } });
    await prisma.weatherRecord.deleteMany({ where: { locationId: testLocation.id } });
    await prisma.location.delete({ where: { id: testLocation.id } });
  });

  it('triggers alert when temperature exceeds configured threshold', async () => {
    const record = await prisma.weatherRecord.create({
      data: {
        locationId: testLocation.id,
        recordedAt: new Date('2026-09-29T10:00:00Z'),
        temperature: 41.5, // > 38.0 threshold
        feelsLikeTemperature: 44.0,
        humidity: 40,
        windSpeed: 10,
        precipitation: 0,
        weatherCode: 0,
      },
    });

    const result = await AlertEngine.evaluateWeatherRecord(testLocation, record);
    expect(result.triggeredAlerts).toBeGreaterThanOrEqual(1);

    const activeAlert = await prisma.weatherAlert.findFirst({
      where: { locationId: testLocation.id, status: 'ACTIVE' },
    });
    expect(activeAlert).toBeDefined();
    expect(activeAlert?.actualValue).toBe(41.5);
  });

  it('prevents duplicate alert when temperature remains above threshold', async () => {
    const secondRecord = await prisma.weatherRecord.create({
      data: {
        locationId: testLocation.id,
        recordedAt: new Date('2026-09-29T11:00:00Z'),
        temperature: 42.0, // still above threshold
        feelsLikeTemperature: 45.0,
        humidity: 38,
        windSpeed: 12,
        precipitation: 0,
        weatherCode: 0,
      },
    });

    const result = await AlertEngine.evaluateWeatherRecord(testLocation, secondRecord);
    // Should NOT create another duplicate alert
    expect(result.triggeredAlerts).toBe(0);

    const count = await prisma.weatherAlert.count({
      where: { locationId: testLocation.id, status: 'ACTIVE' },
    });
    expect(count).toBe(1);
  });

  it('automatically resolves alert when conditions normalize', async () => {
    const normalRecord = await prisma.weatherRecord.create({
      data: {
        locationId: testLocation.id,
        recordedAt: new Date('2026-09-29T12:00:00Z'),
        temperature: 30.0, // Below 38.0 threshold
        feelsLikeTemperature: 31.0,
        humidity: 50,
        windSpeed: 8,
        precipitation: 0,
        weatherCode: 0,
      },
    });

    const result = await AlertEngine.evaluateWeatherRecord(testLocation, normalRecord);
    expect(result.resolvedAlerts).toBeGreaterThanOrEqual(1);

    const activeCount = await prisma.weatherAlert.count({
      where: { locationId: testLocation.id, status: 'ACTIVE' },
    });
    expect(activeCount).toBe(0);
  });
});
