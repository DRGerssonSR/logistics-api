import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from '../../domain/entities/package.entity';
import type { PackageRepositoryPort } from '../../domain/ports/package.repository.port';
import type {
  PaginationParams,
  PaginatedResult,
} from '../../../../shared/domain/common/pagination';
import { PackageEntity } from './package.entity.sql';

@Injectable()
export class PackageRepositorySQLAdapter implements PackageRepositoryPort {
  constructor(
    @InjectRepository(PackageEntity)
    private readonly packageRepository: Repository<PackageEntity>,
  ) {}

  async create(packageEntity: Package): Promise<Package> {
    const entity = this.toEntity(packageEntity);
    const savedEntity = await this.packageRepository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Package | null> {
    const packageEntity = await this.packageRepository.findOne({
      where: { id },
    });

    if (!packageEntity) {
      return null;
    }

    return this.toDomain(packageEntity);
  }

  async findByTrackingNumber(
    trackingNumber: string,
  ): Promise<Package | null> {
    const packageEntity = await this.packageRepository.findOne({
      where: { trackingNumber },
    });

    if (!packageEntity) {
      return null;
    }

    return this.toDomain(packageEntity);
  }

  async findByUserId(
    userId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Package>> {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [packageEntities, total] =
      await this.packageRepository.findAndCount({
        where: { userId },
        skip,
        take: limit,
        order: {
          createdAt: 'DESC',
        },
      });

    const totalPages = Math.ceil(total / limit);

    return {
      data: packageEntities.map((entity) => this.toDomain(entity)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<Package>> {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [packageEntities, total] =
      await this.packageRepository.findAndCount({
        skip,
        take: limit,
        order: {
          createdAt: 'DESC',
        },
      });

    const totalPages = Math.ceil(total / limit);

    return {
      data: packageEntities.map((entity) => this.toDomain(entity)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async update(packageEntity: Package): Promise<Package> {
    const entity = this.toEntity(packageEntity);
    const savedEntity = await this.packageRepository.save(entity);
    return this.toDomain(savedEntity);
  }

  private toEntity(packageEntity: Package): PackageEntity {
    const entity = new PackageEntity();
    entity.id = packageEntity.id;
    entity.trackingNumber = packageEntity.trackingNumber;
    entity.userId = packageEntity.userId;
    entity.origin = packageEntity.origin;
    entity.destination = packageEntity.destination;
    entity.status = packageEntity.status;
    entity.weight = packageEntity.weight;
    entity.dimensions = packageEntity.dimensions;
    entity.createdAt = packageEntity.createdAt;
    entity.updatedAt = packageEntity.updatedAt;
    return entity;
  }

  private toDomain(entity: PackageEntity): Package {
    return new Package({
      id: entity.id,
      trackingNumber: entity.trackingNumber,
      userId: entity.userId,
      origin: entity.origin,
      destination: entity.destination,
      status: entity.status,
      weight: Number(entity.weight),
      dimensions: entity.dimensions,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}

