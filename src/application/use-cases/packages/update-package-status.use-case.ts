import { Injectable, Inject } from '@nestjs/common';
import { PackageNotFoundError } from '../../../domain/errors/package-not-found.error';
import { InvalidStatusTransitionError } from '../../../domain/errors/invalid-status-transition.error';
import { InvalidPackageStatusError } from '../../../domain/errors/invalid-package-status.error';
import { UserNotFoundByIdError } from '../../../domain/errors/user-not-found-by-id.error';
import { PackageStatus } from '../../../domain/value-objects/package-status.vo';
import { UserRole } from '../../../domain/value-objects/user-role.vo';
import type { PackageRepositoryPort } from '../../../domain/ports/output/package.repository.port';
import type { UserRepositoryPort } from '../../../domain/ports/output/user.repository.port';
import type { UpdatePackageStatusRequest } from '../../dto/packages/update-package-status.request';
import type { UpdatePackageStatusResponse } from '../../dto/packages/update-package-status.response';
import { Package } from '../../../domain/entities/package.entity';
import { PackageMapper } from '../../mappers/package.mapper';

@Injectable()
export class UpdatePackageStatusUseCase {
  constructor(
    @Inject('PackageRepositoryPort')
    private readonly packageRepository: PackageRepositoryPort,
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(
    packageId: string,
    request: UpdatePackageStatusRequest,
    user: { id: string; role: UserRole },
  ): Promise<UpdatePackageStatusResponse> {

    if (user.role !== UserRole.ADMIN) {
      throw new Error('Only administrators can update package status');
    }

    if (!Object.values(PackageStatus).includes(request.status)) {
      throw new InvalidPackageStatusError(request.status);
    }

    const packageEntity = await this.packageRepository.findById(packageId);
    if (!packageEntity) {
      throw new PackageNotFoundError(packageId);
    }

    this.validateStatusTransition(packageEntity.status, request.status);

    const updatedPackage = packageEntity.update({
      status: request.status,
      updatedAt: new Date(),
    });

    const savedPackage = await this.packageRepository.update(updatedPackage);

    const owner = await this.userRepository.findById(savedPackage.userId);
    if (!owner) {
      throw new UserNotFoundByIdError(savedPackage.userId);
    }

    return PackageMapper.toResponseWithOwner(savedPackage, owner);
  }

  private validateStatusTransition(
    currentStatus: PackageStatus,
    newStatus: PackageStatus,
  ): void {

    if (currentStatus === newStatus) {
      return;
    }

    // Transiciones válidas:
    // PENDING -> IN_TRANSIT
    // IN_TRANSIT -> DELIVERED
    // No se puede retroceder ni cambiar desde DELIVERED
    const validTransitions: Record<PackageStatus, PackageStatus[]> = {
      [PackageStatus.PENDING]: [PackageStatus.IN_TRANSIT],
      [PackageStatus.IN_TRANSIT]: [PackageStatus.DELIVERED],
      [PackageStatus.DELIVERED]: []
    };

    const allowedStatuses = validTransitions[currentStatus];
    if (!allowedStatuses.includes(newStatus)) {
      throw new InvalidStatusTransitionError(currentStatus, newStatus);
    }
  }
}

