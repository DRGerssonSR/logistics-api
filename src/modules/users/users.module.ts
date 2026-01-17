import { Module } from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
import { UserRepositoryInMemoryAdapter } from '../../infrastructure/persistence/in-memory/user.repository.in-memory.adapter';
import { UsersController } from '../../infrastructure/controllers/users.controller';

@Module({
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    ListUsersUseCase,
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepositoryInMemoryAdapter,
    },
  ],
  exports: [CreateUserUseCase, ListUsersUseCase],
})
export class UsersModule {}

