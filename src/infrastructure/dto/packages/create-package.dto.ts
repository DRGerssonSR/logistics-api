import {
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PackageDimensionsDto {
  @IsNumber()
  @Min(0.1)
  length: number;

  @IsNumber()
  @Min(0.1)
  width: number;

  @IsNumber()
  @Min(0.1)
  height: number;
}

export class CreatePackageDto {
  @IsString()
  origin: string;

  @IsString()
  destination: string;

  @IsNumber()
  @Min(0.1)
  weight: number;

  @ValidateNested()
  @Type(() => PackageDimensionsDto)
  @IsObject()
  dimensions: PackageDimensionsDto;
}

