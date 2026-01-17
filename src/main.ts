import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsersSeed } from './infrastructure/seeds/users.seed';
import { ResponseInterceptor } from './infrastructure/interceptors/response.interceptor';
import { HttpExceptionFilter } from './infrastructure/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Formato estándar de respuestas
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  // Ejecutar seeders
  const usersSeed = app.get(UsersSeed);
  await usersSeed.seed();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
