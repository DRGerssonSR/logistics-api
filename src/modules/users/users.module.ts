import { Module } from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
import { GetUserUseCase } from '../../application/use-cases/users/get-user.use-case';
import { UsersController } from '../../infrastructure/controllers/users.controller';

@Module({
  controllers: [UsersController],
  providers: [CreateUserUseCase, ListUsersUseCase, GetUserUseCase],
  exports: [CreateUserUseCase, ListUsersUseCase, GetUserUseCase],
})
export class UsersModule {}

