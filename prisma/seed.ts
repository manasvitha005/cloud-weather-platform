import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialLocations = [
  {
    name: 'Hyderabad',
    country: 'India',
    latitude: 17.3850,
    longitude: 78.4867,
    timezone: 'Asia/Kolkata',
    elevation: 542.0,
    isActive: true,
  },
  {
    name: 'Bengaluru',
    country: 'India',
    latitude: 12.9716,
    longitude: 77.5946,
    timezone: 'Asia/Kolkata',
    elevation: 920.0,
    isActive: true,
  },
  {
    name: 'Mumbai',
    country: 'India',
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
    elevation: 14.0,
    isActive: true,
  },
  {
    name: 'Delhi',
    country: 'India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
    elevation: 216.0,
    isActive: true,
  },
  {
    name: 'Chennai',
    country: 'India',
    latitude: 13.0827,
    longitude: 80.2707,
    timezone: 'Asia/Kolkata',
    elevation: 6.0,
    isActive: true,
  },
  {
    name: 'San Francisco',
    country: 'United States',
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
    elevation: 16.0,
    isActive: true,
  },
  {
    name: 'London',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
    elevation: 25.0,
    isActive: true,
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
    elevation: 40.0,
    isActive: true,
  },
];

const defaultAlertRules = [
  {
    metric: 'TEMPERATURE_HIGH',
    operator: 'GREATER_THAN',
    threshold: 38.0,
    severity: 'WARNING',
    isEnabled: true,
    title: 'High Temperature Warning',
    description: 'Triggered when ambient temperature exceeds 38°C.',
  },
  {
    metric: 'TEMPERATURE_HIGH',
    operator: 'GREATER_THAN',
    threshold: 42.0,
    severity: 'CRITICAL',
    title: 'Extreme Heat Alert',
    description: 'Triggered when ambient temperature exceeds 42°C.',
  },
  {
    metric: 'PRECIPITATION_HIGH',
    operator: 'GREATER_THAN',
    threshold: 12.0,
    severity: 'WARNING',
    title: 'Heavy Rainfall Warning',
    description: 'Triggered when hourly precipitation exceeds 12mm.',
  },
  {
    metric: 'WIND_HIGH',
    operator: 'GREATER_THAN',
    threshold: 40.0,
    severity: 'CRITICAL',
    title: 'High Wind / Gale Warning',
    description: 'Triggered when wind speed exceeds 40 km/h.',
  },
  {
    metric: 'HUMIDITY_HIGH',
    operator: 'GREATER_THAN',
    threshold: 88.0,
    severity: 'INFO',
    title: 'Elevated Humidity Advisory',
    description: 'Triggered when relative humidity exceeds 88%.',
  },
];

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Locations
  for (const loc of initialLocations) {
    const existing = await prisma.location.findFirst({
      where: {
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
    });

    if (!existing) {
      const created = await prisma.location.create({
        data: loc,
      });
      console.log(`✓ Added location: ${created.name}, ${created.country}`);
    } else {
      console.log(`- Location already exists: ${loc.name}`);
    }
  }

  // 2. Seed Default Alert Rules
  for (const rule of defaultAlertRules) {
    const existingRule = await prisma.alertRule.findFirst({
      where: {
        metric: rule.metric,
        threshold: rule.threshold,
        severity: rule.severity,
      },
    });

    if (!existingRule) {
      await prisma.alertRule.create({
        data: rule,
      });
      console.log(`✓ Created alert rule: ${rule.title} (${rule.metric} > ${rule.threshold})`);
    } else {
      console.log(`- Alert rule already exists: ${rule.title}`);
    }
  }

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
