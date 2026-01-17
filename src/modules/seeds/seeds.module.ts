import { Module } from '@nestjs/common';
import { UsersSeed } from '../../infrastructure/seeds/users.seed';

@Module({
  providers: [UsersSeed],
  exports: [UsersSeed],
})
export class SeedsModule {}

