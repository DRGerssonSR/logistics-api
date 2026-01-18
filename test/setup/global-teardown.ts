import { stopTestDatabases } from './docker-test-setup';

export default async function globalTeardown() {
  console.log('🛑 Global Teardown: Stopping test databases...');
  await stopTestDatabases();
  console.log('✅ Global Teardown: Test databases stopped!');
}

