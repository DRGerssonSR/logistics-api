import { Package } from '../../domain/entities/package.entity';
import { PackageStatus } from '../../domain/value-objects/package-status.vo';
import type { PackageDimensions } from '../../domain/entities/package.entity';
import type { UserResponse } from './user.mapper';
import { User } from '../../domain/entities/user.entity';
import { UserMapper } from './user.mapper';

export interface PackageResponse {
  id: string;
  trackingNumber: string;
  userId: string;
  origin: string;
  destination: string;
  status: PackageStatus;
  weight: number;
  dimensions: PackageDimensions;
  createdAt: Date;
  updatedAt: Date;
  owner?: UserResponse;
}

export class PackageMapper {
  static toResponse(packageEntity: Package): PackageResponse {
    return {
      id: packageEntity.id,
      trackingNumber: packageEntity.trackingNumber,
      userId: packageEntity.userId,
      origin: packageEntity.origin,
      destination: packageEntity.destination,
      status: packageEntity.status,
      weight: packageEntity.weight,
      dimensions: packageEntity.dimensions,
      createdAt: packageEntity.createdAt,
      updatedAt: packageEntity.updatedAt,
    };
  }

  static toResponseWithOwner(
    packageEntity: Package,
    owner: User,
  ): PackageResponse {
    return {
      ...this.toResponse(packageEntity),
      owner: UserMapper.toResponse(owner),
    };
  }

  static toResponseList(packages: Package[]): PackageResponse[] {
    return packages.map((pkg) => PackageMapper.toResponse(pkg));
  }
}

