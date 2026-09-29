import { WeatherCollector } from '../src/services/collection/collector';

async function test() {
  console.log('🚀 Running test collection run...');
  const result = await WeatherCollector.executeRun('MANUAL');
  console.log('Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
