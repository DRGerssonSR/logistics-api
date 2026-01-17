import { Injectable } from '@nestjs/common';
import { Tracking } from '../../../domain/entities/tracking.entity';
import type { TrackingRepositoryPort } from '../../../domain/ports/output/tracking.repository.port';

@Injectable()
export class TrackingRepositoryInMemoryAdapter
  implements TrackingRepositoryPort
{
  private trackings: Map<string, Tracking> = new Map();

  async create(tracking: Tracking): Promise<Tracking> {
    this.trackings.set(tracking.id, tracking);
    return tracking;
  }

  async findByPackageId(packageId: string): Promise<Tracking[]> {
    return Array.from(this.trackings.values()).filter(
      (tracking) => tracking.packageId === packageId,
    );
  }
}

