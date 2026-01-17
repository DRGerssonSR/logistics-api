import { Tracking } from '../entities/tracking.entity';

export interface TrackingRepositoryPort {
  create(tracking: Tracking): Promise<Tracking>;
  findByPackageId(packageId: string): Promise<Tracking[]>;
}

