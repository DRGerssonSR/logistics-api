import { Injectable, Inject } from '@nestjs/common';
import type { UserRepositoryPort } from '../../../domain/ports/output/user.repository.port';
import type { PasswordHasherPort } from '../../../domain/ports/output/password-hasher.port';
import type { TokenGeneratorPort } from '../../../domain/ports/output/token-generator.port';
import { InvalidCredentialsError } from '../../../domain/errors/invalid-credentials.error';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';
import type { LoginRequest } from '../../dto/auth/login.request';
import type { LoginResponse } from '../../dto/auth/login.response';
import { UserMapper } from '../../mappers/user.mapper';

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

