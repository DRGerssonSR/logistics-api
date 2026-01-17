import { Injectable, Inject } from '@nestjs/common';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import type { ListUsersRequest } from '../dto/list-users.request';
import type { ListUsersResponse } from '../dto/list-users.response';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(request: ListUsersRequest): Promise<ListUsersResponse> {
    const result = await this.userRepository.findMany({
      page: request.page,
      limit: request.limit,
    });

    return {
      data: UserMapper.toResponseList(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}

