import { prisma } from '@/lib/prisma';
import { AlertRule, Location, WeatherRecord } from '@prisma/client';

export interface AlertEvaluationResult {
  triggeredAlerts: number;
  resolvedAlerts: number;
  details: string[];
}

export class AlertEngine {
  /**
   * Evaluate a newly recorded weather observation against active rules
   */
  public static async evaluateWeatherRecord(
    location: Location,
    record: WeatherRecord
  ): Promise<AlertEvaluationResult> {
    const rules = await prisma.alertRule.findMany({
      where: { isEnabled: true },
    });

    const result: AlertEvaluationResult = {
      triggeredAlerts: 0,
      resolvedAlerts: 0,
      details: [],
    };

    for (const rule of rules) {
      let isBreached = false;
      let actualValue = 0;
      let metricName = '';
      let unit = '';

      switch (rule.metric) {
        case 'TEMPERATURE_HIGH':
          actualValue = record.temperature;
          metricName = 'Temperature';
          unit = '°C';
          isBreached = actualValue >= rule.threshold;
          break;

        case 'TEMPERATURE_LOW':
          actualValue = record.temperature;
          metricName = 'Temperature';
          unit = '°C';
          isBreached = actualValue <= rule.threshold;
          break;

        case 'PRECIPITATION_HIGH':
          actualValue = record.precipitation;
          metricName = 'Precipitation';
          unit = 'mm';
          isBreached = actualValue >= rule.threshold;
          break;

        case 'WIND_HIGH':
          actualValue = record.windSpeed;
          metricName = 'Wind Speed';
          unit = 'km/h';
          isBreached = actualValue >= rule.threshold;
          break;

        case 'HUMIDITY_HIGH':
          actualValue = record.humidity;
          metricName = 'Relative Humidity';
          unit = '%';
          isBreached = actualValue >= rule.threshold;
          break;

        default:
          break;
      }

      // Check if an ACTIVE alert of this rule type already exists for this location
      const existingAlert = await prisma.weatherAlert.findFirst({
        where: {
          locationId: location.id,
          type: rule.metric,
          status: 'ACTIVE',
        },
      });

      if (isBreached) {
        if (!existingAlert) {
          // Create new active alert
          await prisma.weatherAlert.create({
            data: {
              locationId: location.id,
              type: rule.metric,
              severity: rule.severity,
              title: `${rule.title} in ${location.name}`,
              message: `${metricName} reached ${actualValue.toFixed(1)}${unit}, crossing configured threshold of ${rule.threshold}${unit}.`,
              threshold: rule.threshold,
              actualValue,
              status: 'ACTIVE',
              triggeredAt: record.recordedAt,
            },
          });
          result.triggeredAlerts += 1;
          result.details.push(`Alert triggered: ${rule.title} for ${location.name} (${actualValue}${unit})`);
        } else {
          // Update actual value if still active
          await prisma.weatherAlert.update({
            where: { id: existingAlert.id },
            data: {
              actualValue,
              message: `${metricName} currently at ${actualValue.toFixed(1)}${unit} (threshold: ${rule.threshold}${unit}).`,
            },
          });
        }
      } else if (existingAlert) {
        // Condition cleared -> resolve the alert
        await prisma.weatherAlert.update({
          where: { id: existingAlert.id },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            message: `${metricName} normalized to ${actualValue.toFixed(1)}${unit}. Alert resolved.`,
          },
        });
        result.resolvedAlerts += 1;
        result.details.push(`Alert resolved: ${rule.title} for ${location.name}`);
      }
    }

    return result;
  }
}
