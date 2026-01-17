import { Injectable, Inject } from '@nestjs/common';
import { PackageNotFoundError } from '../../../packages/domain/errors/package-not-found.error';
import { UnauthorizedPackageAccessError } from '../../../packages/domain/errors/unauthorized-package-access.error';
import { InvalidPackageStatusError } from '../../../packages/domain/errors/invalid-package-status.error';
import { PackageStatus } from '../../../packages/domain/value-objects/package-status.vo';
import { UserRole } from '../../../users/domain/value-objects/user-role.vo';
import type { PackageRepositoryPort } from '../../../packages/domain/ports/package.repository.port';
import type { TrackingRepositoryPort } from '../../domain/ports/tracking.repository.port';
import type { CreateTrackingRequest } from '../dto/create-tracking.request';
import type { CreateTrackingResponse } from '../dto/create-tracking.response';
import { Tracking } from '../../domain/entities/tracking.entity';
import { TrackingMapper } from '../mappers/tracking.mapper';

@Injectable()
export class CreateTrackingUseCase {
  constructor(
    @Inject('PackageRepositoryPort')
    private readonly packageRepository: PackageRepositoryPort,
    @Inject('TrackingRepositoryPort')
    private readonly trackingRepository: TrackingRepositoryPort,
  ) {}

  async execute(
    packageId: string,
    request: CreateTrackingRequest,
    user: { id: string; role: UserRole },
  ): Promise<CreateTrackingResponse> {
    const packageEntity = await this.packageRepository.findById(packageId);
    if (!packageEntity) {
      throw new PackageNotFoundError(packageId);
    }

    if (user.role === UserRole.USER && packageEntity.userId !== user.id) {
      throw new UnauthorizedPackageAccessError();
    }

    if (!Object.values(PackageStatus).includes(request.status)) {
      throw new InvalidPackageStatusError(request.status);
    }

    const tracking = Tracking.create({
      packageId,
      location: request.location,
      status: request.status,
      notes: request.notes,
    });

    const createdTracking = await this.trackingRepository.create(tracking);

    return TrackingMapper.toResponse(createdTracking);
  }
}

