import {
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PackageDimensionsDto {
  @ApiProperty({
    description: 'Longitud del paquete en metros',
    example: 1.5,
    minimum: 0.1,
  })
  @IsNumber()
  @Min(0.1)
  length: number;

  @ApiProperty({
    description: 'Ancho del paquete en metros',
    example: 1.0,
    minimum: 0.1,
  })
  @IsNumber()
  @Min(0.1)
  width: number;

  @ApiProperty({
    description: 'Alto del paquete en metros',
    example: 0.5,
    minimum: 0.1,
  })
  @IsNumber()
  @Min(0.1)
  height: number;
}

export class CreatePackageDto {
  @ApiProperty({
    description: 'Ciudad de origen del paquete',
    example: 'Ciudad de México',
  })
  @IsString()
  origin: string;

  @ApiProperty({
    description: 'Ciudad de destino del paquete',
    example: 'Guadalajara',
  })
  @IsString()
  destination: string;

  @ApiProperty({
    description: 'Peso del paquete en kilogramos',
    example: 5.5,
    minimum: 0.1,
  })
  @IsNumber()
  @Min(0.1)
  weight: number;

  @ApiProperty({
    description: 'Dimensiones del paquete',
    type: PackageDimensionsDto,
  })
  @ValidateNested()
  @Type(() => PackageDimensionsDto)
  @IsObject()
  dimensions: PackageDimensionsDto;
}

