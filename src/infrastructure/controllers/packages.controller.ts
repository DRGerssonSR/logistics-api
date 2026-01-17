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
import { CreatePackageUseCase } from '../../application/use-cases/packages/create-package.use-case';
import { ListPackagesUseCase } from '../../application/use-cases/packages/list-packages.use-case';
import { GetPackageUseCase } from '../../application/use-cases/packages/get-package.use-case';
import { UpdatePackageStatusUseCase } from '../../application/use-cases/packages/update-package-status.use-case';
import { UserNotFoundByIdError } from '../../domain/errors/user-not-found-by-id.error';
import { PackageNotFoundError } from '../../domain/errors/package-not-found.error';
import { UnauthorizedPackageAccessError } from '../../domain/errors/unauthorized-package-access.error';
import { InvalidStatusTransitionError } from '../../domain/errors/invalid-status-transition.error';
import { InvalidPackageStatusError } from '../../domain/errors/invalid-package-status.error';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { CreatePackageDto } from '../dto/packages/create-package.dto';
import { ListPackagesQueryDto } from '../dto/packages/list-packages-query.dto';
import { UpdatePackageStatusDto } from '../dto/packages/update-package-status.dto';

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

