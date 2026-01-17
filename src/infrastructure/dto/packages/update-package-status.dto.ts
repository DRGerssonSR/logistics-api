import { IsEnum } from 'class-validator';
import { PackageStatus } from '../../../domain/value-objects/package-status.vo';

export class UpdatePackageStatusDto {
  @IsEnum(PackageStatus, {
    message: 'Status must be one of: PENDING, IN_TRANSIT, DELIVERED',
  })
  status: PackageStatus;
}

