import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { InvalidRoleError } from '../../domain/errors/invalid-role.error';
import { CreateUserDto } from '../dto/users/create-user.dto';
import { ListUsersQueryDto } from '../dto/users/list-users-query.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
  ) {}

  @Get()
  async findAll(@Query() query: ListUsersQueryDto) {
    try {
      const result = await this.listUsersUseCase.execute({
        page: query.page || 1,
        limit: query.limit || 10,
      });

      return result;
    } catch (error: any) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    try {
      const user = await this.createUserUseCase.execute({
        email: dto.email,
        password: dto.password,
        name: dto.name,
        role: dto.role,
      });

      return user;
    } catch (error: any) {
      if (error instanceof UserAlreadyExistsError) {
        throw new HttpException(
          error.message,
          HttpStatus.CONFLICT,
        );
      }
      if (error instanceof InvalidRoleError) {
        throw new HttpException(
          error.message,
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

