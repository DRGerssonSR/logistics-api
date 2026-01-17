import { Injectable, Inject } from '@nestjs/common';
import type { UserRepositoryPort } from '../../../domain/ports/output/user.repository.port';
import { UserNotFoundByIdError } from '../../../domain/errors/user-not-found-by-id.error';
import type { GetUserResponse } from '../../dto/users/get-user.response';
import { UserMapper } from '../../mappers/user.mapper';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(userId: string): Promise<GetUserResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundByIdError(userId);
    }

    return UserMapper.toResponse(user);
  }
}

