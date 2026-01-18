import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { Connection } from 'typeorm';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection as MongoConnection } from 'mongoose';
import { ResponseInterceptor } from 'src/shared/infrastructure/interceptors/response.interceptor';
import { HttpExceptionFilter } from 'src/shared/infrastructure/filters/http-exception.filter';

let app: INestApplication;
let moduleFixture: TestingModule;
let postgresConnection: Connection | null = null;
let mongoConnection: MongoConnection | null = null;

const TEST_ENV = {
  DB_HOST: 'localhost',
  DB_PORT: '5433',
  DB_USERNAME: 'testuser',
  DB_PASSWORD: 'testpass',
  DB_NAME: 'logistics_test',
  DB_SYNCHRONIZE: 'true',
  DB_LOGGING: 'false',
  MONGODB_URI: 'mongodb://localhost:27018/logistics_tracking_test',
  JWT_SECRET: 'test-secret-key-for-integration-tests',
  JWT_EXPIRES_IN: '1h',
  NODE_ENV: 'test',
};

const clearPostgres = async (connection: Connection): Promise<void> => {
  if (!connection?.isConnected) return;

  const entities = connection.entityMetadatas;
  for (const entity of entities) {
    const repository = connection.getRepository(entity.name);
    await repository.clear();
  }
};

const clearMongo = async (connection: MongoConnection): Promise<void> => {
  if (!connection?.db) return;

  const collections = await connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
};

export async function createTestApp(): Promise<{
  app: INestApplication;
  moduleFixture: TestingModule;
}> {
  Object.assign(process.env, TEST_ENV);

  moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  await app.init();

  try {
    postgresConnection = moduleFixture.get(Connection);
  } catch {

  }

  try {
    mongoConnection = moduleFixture.get(getConnectionToken());
  } catch {

  }

  return { app, moduleFixture };
}

export async function cleanupTestApp(): Promise<void> {
  if (postgresConnection) {
    try {
      await clearPostgres(postgresConnection);
      await postgresConnection.close();
    } catch (error) {
      console.error('Error cleaning PostgreSQL:', error);
    }
  }

  if (mongoConnection) {
    try {
      await clearMongo(mongoConnection);
      await mongoConnection.close();
    } catch (error) {
      console.error('Error cleaning MongoDB:', error);
    }
  }

  if (app) {
    await app.close();
  }
}

export async function clearDatabases(): Promise<void> {
  if (postgresConnection) {
    try {
      await clearPostgres(postgresConnection);
    } catch (error) {
      console.error('Error clearing PostgreSQL:', error);
    }
  }

  if (mongoConnection) {
    try {
      await clearMongo(mongoConnection);
    } catch (error) {
      console.error('Error clearing MongoDB:', error);
    }
  }
}

