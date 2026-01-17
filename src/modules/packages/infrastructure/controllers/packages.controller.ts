import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Param,
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
import { CreatePackageUseCase } from '../../application/use-cases/create-package.use-case';
import { ListPackagesUseCase } from '../../application/use-cases/list-packages.use-case';
import { GetPackageUseCase } from '../../application/use-cases/get-package.use-case';
import { UpdatePackageStatusUseCase } from '../../application/use-cases/update-package-status.use-case';
import { UserNotFoundByIdError } from '../../../users/domain/errors/user-not-found-by-id.error';
import { PackageNotFoundError } from '../../domain/errors/package-not-found.error';
import { UnauthorizedPackageAccessError } from '../../domain/errors/unauthorized-package-access.error';
import { InvalidStatusTransitionError } from '../../domain/errors/invalid-status-transition.error';
import { InvalidPackageStatusError } from '../../domain/errors/invalid-package-status.error';
import { JwtAuthGuard } from '../../../../shared/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/infrastructure/guards/roles.guard';
import { Roles } from '../../../../shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '../../../../shared/infrastructure/decorators/current-user.decorator';
import { UserRole } from '../../../users/domain/value-objects/user-role.vo';
import { CreatePackageDto } from '../dto/create-package.dto';
import { ListPackagesQueryDto } from '../dto/list-packages-query.dto';
import { UpdatePackageStatusDto } from '../dto/update-package-status.dto';

@ApiTags('packages')
@ApiBearerAuth('JWT-auth')
@Controller('packages')
@UseGuards(JwtAuthGuard)
export class PackagesController {
  constructor(
    private readonly createPackageUseCase: CreatePackageUseCase,
    private readonly listPackagesUseCase: ListPackagesUseCase,
    private readonly getPackageUseCase: GetPackageUseCase,
    private readonly updatePackageStatusUseCase: UpdatePackageStatusUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar paquetes',
    description: 'Obtiene una lista paginada de paquetes. USER ve solo sus paquetes, ADMIN ve todos',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lista de paquetes obtenida exitosamente',
  })
  async findAll(
    @Query() query: ListPackagesQueryDto,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.listPackagesUseCase.execute({
        userId: user.id,
        userRole: user.role,
        page: query.page || 1,
        limit: query.limit || 10,
      });

      return result;
    } catch (error) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener paquete por ID',
    description: 'Obtiene los datos de un paquete específico con información del propietario',
  })
  @ApiParam({ name: 'id', description: 'ID del paquete', type: String })
  @ApiResponse({
    status: 200,
    description: 'Paquete encontrado',
  })
  @ApiResponse({ status: 404, description: 'Paquete no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado para ver este paquete' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      const packageEntity = await this.getPackageUseCase.execute(id, user);
      return packageEntity;
    } catch (error) {
      if (error instanceof PackageNotFoundError) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof UnauthorizedPackageAccessError) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      }
      if (error instanceof UserNotFoundByIdError) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear paquete',
    description: 'Registra un nuevo paquete con tracking number único',
  })
  @ApiBody({ type: CreatePackageDto })
  @ApiResponse({
    status: 201,
    description: 'Paquete creado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async create(
    @Body() dto: CreatePackageDto,
    @CurrentUser() user: any,
  ) {
    try {
      const packageEntity = await this.createPackageUseCase.execute(
        {
          origin: dto.origin,
          destination: dto.destination,
          weight: dto.weight,
          dimensions: {
            length: dto.dimensions.length,
            width: dto.dimensions.width,
            height: dto.dimensions.height,
          },
        },
        user.id,
      );

      return packageEntity;
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

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar estado del paquete',
    description: 'Actualiza el estado de un paquete. Solo ADMIN. Transiciones válidas: PENDING → IN_TRANSIT → DELIVERED',
  })
  @ApiParam({ name: 'id', description: 'ID del paquete', type: String })
  @ApiBody({ type: UpdatePackageStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Estado del paquete actualizado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  @ApiResponse({ status: 404, description: 'Paquete no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado (solo ADMIN)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePackageStatusDto,
    @CurrentUser() user: any,
  ) {
    try {
      const packageEntity = await this.updatePackageStatusUseCase.execute(
        id,
        { status: dto.status },
        user,
      );
      return packageEntity;
    } catch (error) {
      if (error instanceof PackageNotFoundError) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof InvalidStatusTransitionError) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      if (error instanceof InvalidPackageStatusError) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      if (error instanceof UserNotFoundByIdError) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof Error && error.message.includes('Only administrators')) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

