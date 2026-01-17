import { PackageStatus } from '../../../domain/value-objects/package-status.vo';

export interface UpdatePackageStatusRequest {
  status: PackageStatus;
}

