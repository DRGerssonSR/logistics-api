import { Injectable, Inject } from '@nestjs/common';
import { PackageNotFoundError } from '../../../domain/errors/package-not-found.error';
import { UnauthorizedPackageAccessError } from '../../../domain/errors/unauthorized-package-access.error';
import { InvalidPackageStatusError } from '../../../domain/errors/invalid-package-status.error';
import { PackageStatus } from '../../../domain/value-objects/package-status.vo';
import { UserRole } from '../../../domain/value-objects/user-role.vo';
import type { PackageRepositoryPort } from '../../../domain/ports/output/package.repository.port';
import type { TrackingRepositoryPort } from '../../../domain/ports/output/tracking.repository.port';
import type { CreateTrackingRequest } from '../../dto/tracking/create-tracking.request';
import type { CreateTrackingResponse } from '../../dto/tracking/create-tracking.response';
import { Tracking } from '../../../domain/entities/tracking.entity';
import { TrackingMapper } from '../../mappers/tracking.mapper';

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

