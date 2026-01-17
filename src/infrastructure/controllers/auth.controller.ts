import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { LoginDto } from '../dto/auth/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    try {
      const result = await this.loginUseCase.execute({
        email: dto.email,
        password: dto.password,
      });

      return result;
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new HttpException(
          error.message,
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (error instanceof UserNotFoundError) {
        throw new HttpException(
          error.message,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

