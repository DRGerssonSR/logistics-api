import { Injectable, Inject } from '@nestjs/common';
import { PackageNotFoundError } from '../../../domain/errors/package-not-found.error';
import { UnauthorizedPackageAccessError } from '../../../domain/errors/unauthorized-package-access.error';
import { UserNotFoundByIdError } from '../../../domain/errors/user-not-found-by-id.error';
import { UserRole } from '../../../domain/value-objects/user-role.vo';
import type { PackageRepositoryPort } from '../../../domain/ports/output/package.repository.port';
import type { UserRepositoryPort } from '../../../domain/ports/output/user.repository.port';
import type { GetPackageResponse } from '../../dto/packages/get-package.response';
import { PackageMapper } from '../../mappers/package.mapper';

@Injectable()
export class GetPackageUseCase {
  constructor(
    @Inject('PackageRepositoryPort')
    private readonly packageRepository: PackageRepositoryPort,
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(
    packageId: string,
    user: { id: string; role: UserRole },
  ): Promise<GetPackageResponse> {

    const packageEntity = await this.packageRepository.findById(packageId);
    if (!packageEntity) {
      throw new PackageNotFoundError(packageId);
    }

    if (user.role === UserRole.USER && packageEntity.userId !== user.id) {
      throw new UnauthorizedPackageAccessError();
    }

    const owner = await this.userRepository.findById(packageEntity.userId);
    if (!owner) {
      throw new UserNotFoundByIdError(packageEntity.userId);
    }

    return PackageMapper.toResponseWithOwner(packageEntity, owner);
  }
}

