import { PackageStatus } from '../../../domain/value-objects/package-status.vo';

export interface CreateTrackingRequest {
  location: string;
  status: PackageStatus;
  notes?: string;
}

