import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../domain/value-objects/user-role.vo';
import { UserStatus } from '../../../domain/value-objects/user-status.vo';
import { UserAlreadyExistsError } from '../../../domain/errors/user-already-exists.error';
import { InvalidRoleError } from '../../../domain/errors/invalid-role.error';
import { InvalidStatusError } from '../../../domain/errors/invalid-status.error';
import type { UserRepositoryPort } from '../../../domain/ports/output/user.repository.port';
import type { PasswordHasherPort } from '../../../domain/ports/output/password-hasher.port';
import type { CreateUserRequest } from '../../dto/users/create-user.request';
import type { CreateUserResponse } from '../../dto/users/create-user.response';
import { UserMapper } from '../../mappers/user.mapper';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    @Inject('PasswordHasherPort')
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {

    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new UserAlreadyExistsError(request.email);
    }

    const role = this.validateAndConvertRole(request.role);
    const status = this.validateAndConvertStatus(request.status);

    const hashedPassword = await this.passwordHasher.hash(request.password);

    const user = User.create({
      email: request.email,
      password: hashedPassword,
      name: request.name,
      role,
      status,
    });

    const createdUser = await this.userRepository.create(user);
    return UserMapper.toResponse(createdUser);
  }

  private validateAndConvertRole(role: string): UserRole {
    if (role === UserRole.ADMIN || role === UserRole.USER) {
      return role as UserRole;
    }
    throw new InvalidRoleError(role);
  }

  private validateAndConvertStatus(status?: string): UserStatus | undefined {
    if (!status) {
      return undefined;
    }
    if (
      status === UserStatus.ACTIVE ||
      status === UserStatus.INACTIVE ||
      status === UserStatus.BLOCKED
    ) {
      return status as UserStatus;
    }
    throw new InvalidStatusError(status);
  }
}

