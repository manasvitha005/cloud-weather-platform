import { prisma } from '@/lib/prisma';
import { WeatherService } from '@/services/weather/open-meteo';
import { AlertEngine } from '@/services/alerts/alert-engine';
import { TriggerType } from '@/types/monitoring';

export interface CollectionSummary {
  runId: string;
  status: 'SUCCESS' | 'PARTIAL_FAILURE' | 'FAILED';
  triggerType: TriggerType;
  locationsProcessed: number;
  recordsCreated: number;
  alertsTriggered: number;
  durationMs: number;
  errors: Array<{ locationName: string; error: string }>;
  logs: string[];
}

export class WeatherCollector {
  /**
   * Run the full ingestion pipeline across all active monitored locations
   */
  public static async executeRun(triggerType: TriggerType = 'SCHEDULED'): Promise<CollectionSummary> {
    const startTime = Date.now();
    const logs: string[] = [];
    const errors: Array<{ locationName: string; error: string }> = [];

    logs.push(`[${new Date().toISOString()}] Starting ingestion run (Trigger: ${triggerType})`);

    // 1. Initialize CollectionRun record
    const run = await prisma.collectionRun.create({
      data: {
        triggerType,
        status: 'RUNNING',
        startedAt: new Date(),
        logs: logs.join('\n'),
      },
    });

    let recordsCreated = 0;
    let alertsTriggered = 0;
    let locationsProcessed = 0;

    try {
      // 2. Fetch active locations
      const locations = await prisma.location.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      logs.push(`Found ${locations.length} active location(s) to monitor.`);

      // 3. Process each location with fault-tolerance
      for (const loc of locations) {
        try {
          logs.push(`Fetching weather for ${loc.name}, ${loc.country} (${loc.latitude}, ${loc.longitude})...`);

          const { data: rawForecast, latencyMs } = await WeatherService.fetchForecast(
            loc.latitude,
            loc.longitude,
            loc.timezone
          );

          if (!rawForecast.current) {
            throw new Error(`Open-Meteo returned empty current weather for ${loc.name}`);
          }

          const current = WeatherService.normalizeCurrent(rawForecast.current);
          const recordedAt = new Date(current.timestamp);

          // 4. Idempotent record storage
          // Check if record for this location + timestamp already exists
          const existingRecord = await prisma.weatherRecord.findFirst({
            where: {
              locationId: loc.id,
              recordedAt,
            },
          });

          let record;
          if (!existingRecord) {
            record = await prisma.weatherRecord.create({
              data: {
                locationId: loc.id,
                recordedAt,
                temperature: current.temperature,
                feelsLikeTemperature: current.feelsLike,
                humidity: current.humidity,
                windSpeed: current.windSpeed,
                windDirection: current.windDirection,
                precipitation: current.precipitation,
                pressure: current.pressure,
                weatherCode: current.weatherCode,
                conditionText: current.conditionText,
                uvIndex: current.uvIndex,
                visibility: current.visibility,
              },
            });
            recordsCreated += 1;
            logs.push(`Stored observation for ${loc.name} at ${recordedAt.toISOString()} (${latencyMs}ms)`);
          } else {
            record = existingRecord;
            logs.push(`Skipped existing observation for ${loc.name} at ${recordedAt.toISOString()} (idempotent)`);
          }

          // 5. Evaluate Alert Rules
          const alertResult = await AlertEngine.evaluateWeatherRecord(loc, record);
          alertsTriggered += alertResult.triggeredAlerts;
          if (alertResult.details.length > 0) {
            logs.push(...alertResult.details.map((d) => `[Alert] ${d}`));
          }

          // 6. Update Location elevation if newly available
          if (rawForecast.elevation !== undefined && loc.elevation === null) {
            await prisma.location.update({
              where: { id: loc.id },
              data: { elevation: rawForecast.elevation },
            });
          }

          locationsProcessed += 1;
        } catch (locErr: unknown) {
          const errMsg = locErr instanceof Error ? locErr.message : 'Unknown location processing error';
          logs.push(`[ERROR] Failed processing ${loc.name}: ${errMsg}`);
          errors.push({ locationName: loc.name, error: errMsg });
        }
      }

      // 4. Determine final run status
      let finalStatus: 'SUCCESS' | 'PARTIAL_FAILURE' | 'FAILED' = 'SUCCESS';
      if (locationsProcessed === 0 && locations.length > 0) {
        finalStatus = 'FAILED';
      } else if (errors.length > 0) {
        finalStatus = 'PARTIAL_FAILURE';
      }

      const durationMs = Date.now() - startTime;
      logs.push(
        `Run finished in ${durationMs}ms. Status: ${finalStatus}. Processed: ${locationsProcessed}/${locations.length}, Records: ${recordsCreated}, Alerts: ${alertsTriggered}`
      );

      // Update the DB record
      await prisma.collectionRun.update({
        where: { id: run.id },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          locationsProcessed,
          recordsCreated,
          alertsTriggered,
          durationMs,
          errorMessage: errors.length > 0 ? JSON.stringify(errors) : null,
          logs: logs.join('\n'),
        },
      });

      return {
        runId: run.id,
        status: finalStatus,
        triggerType,
        locationsProcessed,
        recordsCreated,
        alertsTriggered,
        durationMs,
        errors,
        logs,
      };
    } catch (globalErr: unknown) {
      const durationMs = Date.now() - startTime;
      const errMsg = globalErr instanceof Error ? globalErr.message : 'Fatal pipeline error';
      logs.push(`[FATAL] Pipeline crashed: ${errMsg}`);

      await prisma.collectionRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          durationMs,
          errorMessage: errMsg,
          logs: logs.join('\n'),
        },
      });

      return {
        runId: run.id,
        status: 'FAILED',
        triggerType,
        locationsProcessed,
        recordsCreated,
        alertsTriggered,
        durationMs,
        errors: [{ locationName: 'GLOBAL', error: errMsg }],
        logs,
      };
    }
  }
}
