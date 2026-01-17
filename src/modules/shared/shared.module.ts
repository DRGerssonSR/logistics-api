import { Module, Global } from '@nestjs/common';
import { UserRepositoryInMemoryAdapter } from '../../infrastructure/persistence/in-memory/user.repository.in-memory.adapter';
import { PasswordHasherService } from '../../infrastructure/services/password-hasher.service';

@Global()
@Module({
  providers: [
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepositoryInMemoryAdapter,
    },
    {
      provide: 'PasswordHasherPort',
      useClass: PasswordHasherService,
    },
  ],
  exports: ['UserRepositoryPort', 'PasswordHasherPort'],
})
export class SharedModule {}

