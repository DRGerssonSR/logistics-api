import { Module } from '@nestjs/common';
import { CreatePackageUseCase } from '../../application/use-cases/packages/create-package.use-case';
import { PackageRepositoryInMemoryAdapter } from '../../infrastructure/persistence/in-memory/package.repository.in-memory.adapter';
import { PackagesController } from '../../infrastructure/controllers/packages.controller';

@Module({
  controllers: [PackagesController],
  providers: [
    CreatePackageUseCase,
    {
      provide: 'PackageRepositoryPort',
      useClass: PackageRepositoryInMemoryAdapter,
    },
  ],
  exports: [CreatePackageUseCase],
})
export class PackagesModule {}

