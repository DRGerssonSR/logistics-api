import { Injectable, Inject } from '@nestjs/common';
import { Package } from '../../../domain/entities/package.entity';
import { PackageStatus } from '../../../domain/value-objects/package-status.vo';
import { UserNotFoundByIdError } from '../../../domain/errors/user-not-found-by-id.error';
import type { UserRepositoryPort } from '../../../domain/ports/output/user.repository.port';
import type { PackageRepositoryPort } from '../../../domain/ports/output/package.repository.port';
import type { CreatePackageRequest } from '../../dto/packages/create-package.request';
import type { CreatePackageResponse } from '../../dto/packages/create-package.response';
import { PackageMapper } from '../../mappers/package.mapper';

@Injectable()
export class CreatePackageUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    @Inject('PackageRepositoryPort')
    private readonly packageRepository: PackageRepositoryPort,
  ) {}

  async execute(
    request: CreatePackageRequest,
    userId: string,
  ): Promise<CreatePackageResponse> {

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundByIdError(userId);
    }

    const packageEntity = Package.create({
      userId,
      origin: request.origin,
      destination: request.destination,
      weight: request.weight,
      dimensions: {
        length: request.dimensions.length,
        width: request.dimensions.width,
        height: request.dimensions.height,
      },
      status: PackageStatus.PENDING,
    });

    const createdPackage = await this.packageRepository.create(packageEntity);

    return PackageMapper.toResponse(createdPackage);
  }
}

