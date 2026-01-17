import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { InvalidRoleError } from '../../domain/errors/invalid-role.error';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CreateUserDto } from '../dto/users/create-user.dto';
import { ListUsersQueryDto } from '../dto/users/list-users-query.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    try {
      const user = await this.createUserUseCase.execute({
        email: dto.email,
        password: dto.password,
        name: dto.name,
        role: dto.role,
      });

      return user;
    } catch (error) {
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

