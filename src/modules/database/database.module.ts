import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from '../../infrastructure/persistence/sql/entities/user.entity';
import { PackageEntity } from '../../infrastructure/persistence/sql/entities/package.entity';
import { UserRepositorySQLAdapter } from '../../infrastructure/persistence/sql/adapters/user.repository.sql.adapter';
import { PackageRepositorySQLAdapter } from '../../infrastructure/persistence/sql/adapters/package.repository.sql.adapter';
import {
  TrackingSchema,
  TrackingMongoSchema,
} from '../../infrastructure/persistence/mongodb/schemas/tracking.schema';
import { TrackingRepositoryMongoAdapter } from '../../infrastructure/persistence/mongodb/adapters/tracking.repository.mongo.adapter';

@Module({
  imports: [
    // PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'logistics_db'),
        entities: [UserEntity, PackageEntity],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
        logging: configService.get<boolean>('DB_LOGGING', false),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([UserEntity, PackageEntity]),
    
    // MongoDB
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost:27017/logistics_tracking'
        );
        return {
          uri,
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: TrackingSchema.name, schema: TrackingMongoSchema },
    ]),
  ],
  providers: [
    UserRepositorySQLAdapter,
    PackageRepositorySQLAdapter,
    TrackingRepositoryMongoAdapter,
  ],
  exports: [
    TypeOrmModule,
    MongooseModule,
    UserRepositorySQLAdapter,
    PackageRepositorySQLAdapter,
    TrackingRepositoryMongoAdapter,
  ],
})
export class DatabaseModule {}