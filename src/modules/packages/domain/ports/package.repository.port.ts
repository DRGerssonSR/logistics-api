import { Package } from '../entities/package.entity';
import type { PaginationParams, PaginatedResult } from '../../../../shared/domain/common/pagination';

export interface PackageRepositoryPort {
  create(packageEntity: Package): Promise<Package>;
  findById(id: string): Promise<Package | null>;
  findByTrackingNumber(trackingNumber: string): Promise<Package | null>;
  findByUserId(
    userId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Package>>;
  findAll(params: PaginationParams): Promise<PaginatedResult<Package>>;
  update(packageEntity: Package): Promise<Package>;
}

