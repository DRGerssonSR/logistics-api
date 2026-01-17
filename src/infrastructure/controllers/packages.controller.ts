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
import { CreatePackageUseCase } from '../../application/use-cases/packages/create-package.use-case';
import { ListPackagesUseCase } from '../../application/use-cases/packages/list-packages.use-case';
import { UserNotFoundByIdError } from '../../domain/errors/user-not-found-by-id.error';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreatePackageDto } from '../dto/packages/create-package.dto';
import { ListPackagesQueryDto } from '../dto/packages/list-packages-query.dto';

@Controller('packages')
@UseGuards(JwtAuthGuard)
export class PackagesController {
  constructor(
    private readonly createPackageUseCase: CreatePackageUseCase,
    private readonly listPackagesUseCase: ListPackagesUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: ListPackagesQueryDto,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.listPackagesUseCase.execute({
        userId: user.id,
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
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
}

