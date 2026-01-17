import { Module } from '@nestjs/common';
import { UsersSeed } from '../users/infrastructure/seeds/users.seed';
import { UsersModule } from '../users/users.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [UsersModule, SharedModule],
  providers: [UsersSeed],
  exports: [UsersSeed],
})
export class SeedsModule {}

