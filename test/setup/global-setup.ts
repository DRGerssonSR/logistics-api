import { startTestDatabases } from './docker-test-setup';

export default async function globalSetup() {
  console.log('🚀 Global Setup: Starting test databases...');
  await startTestDatabases();
  console.log('✅ Global Setup: Test databases ready!');
}

