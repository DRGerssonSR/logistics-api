import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PackageStatus } from '../../../domain/value-objects/package-status.vo';

export class UpdatePackageStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del paquete',
    example: 'IN_TRANSIT',
    enum: PackageStatus,
  })
  @IsEnum(PackageStatus, {
    message: 'Status must be one of: PENDING, IN_TRANSIT, DELIVERED',
  })
  status: PackageStatus;
}

