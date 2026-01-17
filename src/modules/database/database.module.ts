import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from '../../infrastructure/persistence/sql/entities/user.entity';
import { PackageEntity } from '../../infrastructure/persistence/sql/entities/package.entity';
import { UserRepositorySQLAdapter } from '../../infrastructure/persistence/sql/adapters/user.repository.sql.adapter';
import { PackageRepositorySQLAdapter } from '../../infrastructure/persistence/sql/adapters/package.repository.sql.adapter';

@Module({
  imports: [
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
  ],
  providers: [UserRepositorySQLAdapter, PackageRepositorySQLAdapter],
  exports: [
    TypeOrmModule,
    UserRepositorySQLAdapter,
    PackageRepositorySQLAdapter,
  ],
})
export class DatabaseModule {}

