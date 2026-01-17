import { Injectable } from '@nestjs/common';
import { Package } from '../../../domain/entities/package.entity';
import type { PackageRepositoryPort } from '../../../domain/ports/output/package.repository.port';
import type {
  PaginationParams,
  PaginatedResult,
} from '../../../domain/common/pagination';

@Injectable()
export class PackageRepositoryInMemoryAdapter
  implements PackageRepositoryPort
{
  private packages: Map<string, Package> = new Map();

  async create(packageEntity: Package): Promise<Package> {
    this.packages.set(packageEntity.id, packageEntity);
    return packageEntity;
  }

  async findById(id: string): Promise<Package | null> {
    const packageEntity = this.packages.get(id);
    return packageEntity || null;
  }

  async findByTrackingNumber(
    trackingNumber: string,
  ): Promise<Package | null> {
    const packageEntity = Array.from(this.packages.values()).find(
      (pkg) => pkg.trackingNumber === trackingNumber,
    );
    return packageEntity || null;
  }

  async findByUserId(
    userId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Package>> {
    const { page, limit } = params;
    const userPackages = Array.from(this.packages.values()).filter(
      (pkg) => pkg.userId === userId,
    );

    const total = userPackages.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const paginatedPackages = userPackages.slice(skip, skip + limit);

    return {
      data: paginatedPackages,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<Package>> {
    const { page, limit } = params;
    const allPackages = Array.from(this.packages.values());

    const total = allPackages.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const paginatedPackages = allPackages.slice(skip, skip + limit);

    return {
      data: paginatedPackages,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async update(packageEntity: Package): Promise<Package> {
    this.packages.set(packageEntity.id, packageEntity);
    return packageEntity;
  }
}

