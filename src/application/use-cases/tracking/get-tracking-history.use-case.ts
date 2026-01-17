import { Injectable, Inject } from '@nestjs/common';
import { PackageNotFoundError } from '../../../domain/errors/package-not-found.error';
import { TrackingNotFoundError } from '../../../domain/errors/tracking-not-found.error';
import type { PackageRepositoryPort } from '../../../domain/ports/output/package.repository.port';
import type { TrackingRepositoryPort } from '../../../domain/ports/output/tracking.repository.port';
import type { GetTrackingHistoryResponse } from '../../dto/tracking/get-tracking-history.response';
import { TrackingMapper } from '../../mappers/tracking.mapper';

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
  ): Promise<GetTrackingHistoryResponse> {

    const packageEntity = await this.packageRepository.findById(packageId);
    if (!packageEntity) {
      throw new PackageNotFoundError(packageId);
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

