import { Injectable, Inject } from '@nestjs/common';
import { PackageNotFoundError } from '../../../packages/domain/errors/package-not-found.error';
import { UnauthorizedPackageAccessError } from '../../../packages/domain/errors/unauthorized-package-access.error';
import { TrackingNotFoundError } from '../../domain/errors/tracking-not-found.error';
import { UserRole } from '../../../users/domain/value-objects/user-role.vo';
import type { PackageRepositoryPort } from '../../../packages/domain/ports/package.repository.port';
import type { TrackingRepositoryPort } from '../../domain/ports/tracking.repository.port';
import type { GetTrackingHistoryResponse } from '../dto/get-tracking-history.response';
import { TrackingMapper } from '../mappers/tracking.mapper';

@Injectable()
export class GetTrackingHistoryUseCase {
  constructor(
    @Inject('PackageRepositoryPort')
    private readonly packageRepository: PackageRepositoryPort,
    @Inject('TrackingRepositoryPort')
    private readonly trackingRepository: TrackingRepositoryPort,
  ) {}

  async execute(
    packageId: string,
    user: { id: string; role: UserRole },
  ): Promise<GetTrackingHistoryResponse> {
    const packageEntity = await this.packageRepository.findById(packageId);
    if (!packageEntity) {
      throw new PackageNotFoundError(packageId);
    }

    if (user.role === UserRole.USER && packageEntity.userId !== user.id) {
      throw new UnauthorizedPackageAccessError();
    }

    const trackings = await this.trackingRepository.findByPackageId(packageId);

    if (trackings.length === 0) {
      throw new TrackingNotFoundError(packageId);
    }

    const sortedTrackings = trackings.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    return {
      packageId,
      events: TrackingMapper.toResponseList(sortedTrackings),
    };
  }
}

