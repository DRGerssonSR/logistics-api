import { Module, Global } from '@nestjs/common';
import { UserRepositoryInMemoryAdapter } from '../../infrastructure/persistence/in-memory/user.repository.in-memory.adapter';

@Global()
@Module({
  providers: [
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepositoryInMemoryAdapter,
    },
  ],
  exports: ['UserRepositoryPort'],
})
export class SharedModule {}

