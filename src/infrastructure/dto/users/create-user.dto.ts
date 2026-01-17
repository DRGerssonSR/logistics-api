import { IsEmail, IsString, MinLength, IsIn, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsString()
  @IsIn(['ADMIN', 'USER'])
  role: string;

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'BLOCKED'])
  status?: string;
}

