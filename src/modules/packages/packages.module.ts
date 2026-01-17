import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreatePackageUseCase } from './application/use-cases/create-package.use-case';
import { ListPackagesUseCase } from './application/use-cases/list-packages.use-case';
import { GetPackageUseCase } from './application/use-cases/get-package.use-case';
import { UpdatePackageStatusUseCase } from './application/use-cases/update-package-status.use-case';
import { PackageRepositorySQLAdapter } from './infrastructure/persistence/package.repository.sql.adapter';
import { PackagesController } from './infrastructure/controllers/packages.controller';
import { SharedModule } from '../../shared/shared.module';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [SharedModule, DatabaseModule, UsersModule],
  controllers: [PackagesController],
  providers: [
    CreatePackageUseCase,
    ListPackagesUseCase,
    GetPackageUseCase,
    UpdatePackageStatusUseCase,
    {
      provide: 'PackageRepositoryPort',
      useFactory: (packageRepositorySQLAdapter: PackageRepositorySQLAdapter) => {
        return packageRepositorySQLAdapter;
      },
      inject: [PackageRepositorySQLAdapter],
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

