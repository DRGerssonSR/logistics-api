import { Module } from '@nestjs/common';
import {  ConfigService } from '@nestjs/config';
import { CreatePackageUseCase } from '../../application/use-cases/packages/create-package.use-case';
import { ListPackagesUseCase } from '../../application/use-cases/packages/list-packages.use-case';
import { GetPackageUseCase } from '../../application/use-cases/packages/get-package.use-case';
import { UpdatePackageStatusUseCase } from '../../application/use-cases/packages/update-package-status.use-case';
import { PackageRepositoryInMemoryAdapter } from '../../infrastructure/persistence/in-memory/package.repository.in-memory.adapter';
import { PackageRepositorySQLAdapter } from '../../infrastructure/persistence/sql/adapters/package.repository.sql.adapter';
import { PackagesController } from '../../infrastructure/controllers/packages.controller';
import { SharedModule } from '../shared/shared.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [SharedModule, DatabaseModule],
  controllers: [PackagesController],
  providers: [
    CreatePackageUseCase,
    ListPackagesUseCase,
    GetPackageUseCase,
    UpdatePackageStatusUseCase,
    {
      provide: 'PackageRepositoryPort',
      useFactory: (
        configService: ConfigService,
        packageRepositorySQLAdapter: PackageRepositorySQLAdapter,
      ) => {
        // Usar SQL si DB_HOST está configurado, sino usar in-memory
        const useSQL = configService.get<string>('DB_HOST') !== undefined;
        return useSQL
          ? packageRepositorySQLAdapter
          : new PackageRepositoryInMemoryAdapter();
      },
      inject: [ConfigService, PackageRepositorySQLAdapter],
    },
  ],
  exports: [
    CreatePackageUseCase,
    ListPackagesUseCase,
    GetPackageUseCase,
    UpdatePackageStatusUseCase,
    'PackageRepositoryPort',
  ],
})
export class PackagesModule {}

