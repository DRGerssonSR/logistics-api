import { Module } from '@nestjs/common';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { GetUserUseCase } from './application/use-cases/get-user.use-case';
import { UsersController } from './infrastructure/controllers/users.controller';
import { UserRepositorySQLAdapter } from './infrastructure/persistence/user.repository.sql.adapter';
import { SharedModule } from '../../shared/shared.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [SharedModule, DatabaseModule],
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    ListUsersUseCase,
    GetUserUseCase,
    UserRepositorySQLAdapter,
    {
      provide: 'UserRepositoryPort',
      useFactory: (userRepositorySQLAdapter: UserRepositorySQLAdapter) => {
        return userRepositorySQLAdapter;
      },
      inject: [UserRepositorySQLAdapter],
    },
    {
      provide: 'PasswordHasherPort',
      useFactory: (passwordHasher) => passwordHasher,
      inject: ['PasswordHasherService'],
    },
  ],
  exports: [
    CreateUserUseCase,
    ListUsersUseCase,
    GetUserUseCase,
    'UserRepositoryPort',
  ],
})
export class UsersModule {}

