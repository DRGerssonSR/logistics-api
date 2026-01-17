import { Module } from '@nestjs/common';
import { CreatePackageUseCase } from '../../application/use-cases/packages/create-package.use-case';
import { ListPackagesUseCase } from '../../application/use-cases/packages/list-packages.use-case';
import { PackageRepositoryInMemoryAdapter } from '../../infrastructure/persistence/in-memory/package.repository.in-memory.adapter';
import { PackagesController } from '../../infrastructure/controllers/packages.controller';

@Module({
  controllers: [PackagesController],
  providers: [
    CreatePackageUseCase,
    ListPackagesUseCase,
    {
      provide: 'PackageRepositoryPort',
      useClass: PackageRepositoryInMemoryAdapter,
    },
  ],
  exports: [CreatePackageUseCase, ListPackagesUseCase],
})
export class PackagesModule {}

