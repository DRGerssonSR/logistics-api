import { execSync } from 'child_process';
import { existsSync } from 'fs';

const COMPOSE_FILE = 'docker-compose.test.yml';
const POSTGRES_CONTAINER = 'logistics-postgres-test';
const MONGODB_CONTAINER = 'logistics-mongodb-test';

const execDocker = (command: string) => {
  execSync(command, { stdio: 'inherit' });
};

const isContainerRunning = (containerName: string): boolean => {
  try {
    const result = execSync(`docker ps -q -f name=${containerName}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return result.trim().length > 0;
  } catch {
    return false;
  }
};

const waitForContainer = async (
  containerName: string,
  healthCheck: string,
  maxAttempts = 30,
): Promise<void> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      execSync(healthCheck, { stdio: 'ignore' });
      return;
    } catch {
      if (i % 5 === 0 && i > 0) {
        console.log(`⏳ Waiting for ${containerName}... (${i + 1}/${maxAttempts})`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`${containerName} no está listo después de ${maxAttempts} intentos`);
};

export async function startTestDatabases(): Promise<void> {
  console.log('🐳 Starting test databases...');

  if (!existsSync(COMPOSE_FILE)) {
    throw new Error(`Archivo ${COMPOSE_FILE} no encontrado`);
  }

  if (!isContainerRunning(POSTGRES_CONTAINER)) {
    execDocker(`docker compose -f ${COMPOSE_FILE} up -d`);
  } else {
    console.log('⚠️  Test databases already running, verifying health...');
  }

  await waitForContainer(
    'PostgreSQL',
    `docker exec ${POSTGRES_CONTAINER} pg_isready -U testuser`,
  );
  await waitForContainer(
    'MongoDB',
    `docker exec ${MONGODB_CONTAINER} mongosh --eval "db.adminCommand('ping')" --quiet`,
  );

  console.log('✅ Test databases are ready!');
}

export async function stopTestDatabases(): Promise<void> {
  console.log('🛑 Stopping test databases...');
  try {
    execDocker(`docker compose -f ${COMPOSE_FILE} down -v`);
    console.log('✅ Test databases stopped and removed');
  } catch (error) {
    console.error('Error stopping test databases:', error);
  }
}

