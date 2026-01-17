import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
import { GetUserUseCase } from '../../application/use-cases/users/get-user.use-case';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { InvalidRoleError } from '../../domain/errors/invalid-role.error';
import { InvalidStatusError } from '../../domain/errors/invalid-status.error';
import { UserNotFoundByIdError } from '../../domain/errors/user-not-found-by-id.error';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CreateUserDto } from '../dto/users/create-user.dto';
import { ListUsersQueryDto } from '../dto/users/list-users-query.dto';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar usuarios', description: 'Obtiene una lista paginada de usuarios' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
  })
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

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener usuario por ID', description: 'Obtiene los datos de un usuario específico' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: String })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('id') id: string) {
    try {
      const user = await this.getUserUseCase.execute(id);
      return user;
    } catch (error) {
      if (error instanceof UserNotFoundByIdError) {
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

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear usuario', description: 'Crea un nuevo usuario (solo ADMIN)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe' })
  @ApiResponse({ status: 403, description: 'No autorizado (solo ADMIN)' })
  async create(@Body() dto: CreateUserDto) {
    try {
      const user = await this.createUserUseCase.execute({
        email: dto.email,
        password: dto.password,
        name: dto.name,
        role: dto.role,
        status: dto.status as any,
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
      if (error instanceof InvalidStatusError) {
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

