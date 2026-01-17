import {
  Controller,
  Post,
  Get,
  Body,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateTrackingUseCase } from '../../application/use-cases/tracking/create-tracking.use-case';
import { GetTrackingHistoryUseCase } from '../../application/use-cases/tracking/get-tracking-history.use-case';
import { PackageNotFoundError } from '../../domain/errors/package-not-found.error';
import { TrackingNotFoundError } from '../../domain/errors/tracking-not-found.error';
import { InvalidPackageStatusError } from '../../domain/errors/invalid-package-status.error';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateTrackingDto } from '../dto/tracking/create-tracking.dto';

@ApiTags('tracking')
@ApiBearerAuth('JWT-auth')
@Controller('packages/:packageId/tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(
    private readonly createTrackingUseCase: CreateTrackingUseCase,
    private readonly getTrackingHistoryUseCase: GetTrackingHistoryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar evento de tracking',
    description: 'Registra un nuevo evento de seguimiento para un paquete',
  })
  @ApiParam({ name: 'packageId', description: 'ID del paquete', type: String })
  @ApiBody({ type: CreateTrackingDto })
  @ApiResponse({
    status: 201,
    description: 'Evento de tracking creado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Paquete no encontrado' })
  async create(
    @Param('packageId') packageId: string,
    @Body() dto: CreateTrackingDto,
  ) {
    try {
      const tracking = await this.createTrackingUseCase.execute(packageId, {
        location: dto.location,
        status: dto.status,
        notes: dto.notes,
      });
      return tracking;
    } catch (error) {
      if (error instanceof PackageNotFoundError) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof InvalidPackageStatusError) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar historial de tracking',
    description: 'Obtiene el historial completo de eventos de seguimiento de un paquete',
  })
  @ApiParam({ name: 'packageId', description: 'ID del paquete', type: String })
  @ApiResponse({
    status: 200,
    description: 'Historial de tracking obtenido exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Paquete o historial no encontrado' })
  async getHistory(@Param('packageId') packageId: string) {
    try {
      const history = await this.getTrackingHistoryUseCase.execute(packageId);
      return history;
    } catch (error) {
      if (error instanceof PackageNotFoundError) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof TrackingNotFoundError) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

