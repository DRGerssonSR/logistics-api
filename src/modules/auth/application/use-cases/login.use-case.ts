import { Injectable, Inject } from '@nestjs/common';
import type { UserRepositoryPort } from '../../../users/domain/ports/user.repository.port';
import type { PasswordHasherPort } from '../../../../shared/domain/ports/password-hasher.port';
import type { TokenGeneratorPort } from '../../../../shared/domain/ports/token-generator.port';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { UserNotFoundError } from '../../../users/domain/errors/user-not-found.error';
import type { LoginRequest } from '../dto/login.request';
import type { LoginResponse } from '../dto/login.response';
import { UserMapper } from '../../../users/application/mappers/user.mapper';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    @Inject('PasswordHasherPort')
    private readonly passwordHasher: PasswordHasherPort,
    @Inject('TokenGeneratorPort')
    private readonly tokenGenerator: TokenGeneratorPort,
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {

    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new UserNotFoundError(request.email);
    }

    const isPasswordValid = await this.passwordHasher.compare(
      request.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.tokenGenerator.generate({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: UserMapper.toResponse(user),
    };
  }
}

