import { Injectable, Inject } from '@nestjs/common';
import type { PackageRepositoryPort } from '../../../domain/ports/output/package.repository.port';
import type { ListPackagesRequest } from '../../dto/packages/list-packages.request';
import type { ListPackagesResponse } from '../../dto/packages/list-packages.response';
import { UserRole } from '../../../domain/value-objects/user-role.vo';
import { PackageMapper } from '../../mappers/package.mapper';

@Injectable()
export class ListPackagesUseCase {
  constructor(
    @Inject('PackageRepositoryPort')
    private readonly packageRepository: PackageRepositoryPort,
  ) {}

  async execute(request: ListPackagesRequest): Promise<ListPackagesResponse> {
    // Si es ADMIN, obtener todos los paquetes
    // Si es USER, obtener solo sus paquetes
    const result =
      request.userRole === UserRole.ADMIN
        ? await this.packageRepository.findAll({
            page: request.page,
            limit: request.limit,
          })
        : await this.packageRepository.findByUserId(request.userId, {
            page: request.page,
            limit: request.limit,
          });

    return {
      data: PackageMapper.toResponseList(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}

