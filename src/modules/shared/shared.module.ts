import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserRepositoryInMemoryAdapter } from '../../infrastructure/persistence/in-memory/user.repository.in-memory.adapter';
import { UserRepositorySQLAdapter } from '../../infrastructure/persistence/sql/adapters/user.repository.sql.adapter';
import { PasswordHasherService } from '../../infrastructure/services/password-hasher.service';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: 'UserRepositoryPort',
      useFactory: (
        configService: ConfigService,
        userRepositorySQLAdapter: UserRepositorySQLAdapter,
      ) => {
        // Usar SQL si DB_HOST está configurado, sino usar in-memory
        const useSQL = configService.get<string>('DB_HOST') !== undefined;
        return useSQL
          ? userRepositorySQLAdapter
          : new UserRepositoryInMemoryAdapter();
      },
      inject: [ConfigService, UserRepositorySQLAdapter],
    },
    {
      provide: 'PasswordHasherPort',
      useClass: PasswordHasherService,
    },
  ],
  exports: ['UserRepositoryPort', 'PasswordHasherPort'],
})
export class SharedModule {}

