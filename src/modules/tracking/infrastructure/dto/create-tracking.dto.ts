import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PackageStatus } from '../../../packages/domain/value-objects/package-status.vo';

export class CreateTrackingDto {
  @ApiProperty({
    description: 'Ubicación actual del paquete',
    example: 'Centro de distribución CDMX',
  })
  @IsString()
  location: string;

  @ApiProperty({
    description: 'Estado del paquete en este momento',
    example: 'IN_TRANSIT',
    enum: PackageStatus,
  })
  @IsEnum(PackageStatus, {
    message: 'Status must be one of: PENDING, IN_TRANSIT, DELIVERED',
  })
  status: PackageStatus;

  @ApiProperty({
    description: 'Notas adicionales sobre el evento',
    example: 'Paquete en tránsito hacia destino final',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

