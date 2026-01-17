import { Module } from '@nestjs/common';
import { CreatePackageUseCase } from '../../application/use-cases/packages/create-package.use-case';
import { ListPackagesUseCase } from '../../application/use-cases/packages/list-packages.use-case';
import { GetPackageUseCase } from '../../application/use-cases/packages/get-package.use-case';
import { PackageRepositoryInMemoryAdapter } from '../../infrastructure/persistence/in-memory/package.repository.in-memory.adapter';
import { PackagesController } from '../../infrastructure/controllers/packages.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [PackagesController],
  providers: [
    CreatePackageUseCase,
    ListPackagesUseCase,
    GetPackageUseCase,
    {
      provide: 'PackageRepositoryPort',
      useClass: PackageRepositoryInMemoryAdapter,
    },
  ],
  exports: [CreatePackageUseCase, ListPackagesUseCase, GetPackageUseCase],
})
export class PackagesModule {}

