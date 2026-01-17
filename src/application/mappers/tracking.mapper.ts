import { Tracking } from '../../domain/entities/tracking.entity';
import { PackageStatus } from '../../domain/value-objects/package-status.vo';

export interface TrackingResponse {
  id: string;
  packageId: string;
  location: string;
  status: PackageStatus;
  timestamp: Date;
  notes?: string;
  createdAt: Date;
}

export class TrackingMapper {
  static toResponse(tracking: Tracking): TrackingResponse {
    return {
      id: tracking.id,
      packageId: tracking.packageId,
      location: tracking.location,
      status: tracking.status,
      timestamp: tracking.timestamp,
      notes: tracking.notes,
      createdAt: tracking.createdAt,
    };
  }

  static toResponseList(trackings: Tracking[]): TrackingResponse[] {
    return trackings.map((tracking) => this.toResponse(tracking));
  }
}

