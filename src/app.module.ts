import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { SeedsModule } from './modules/seeds/seeds.module';
import { SharedModule } from './modules/shared/shared.module';

@Module({
  imports: [SharedModule, UsersModule, SeedsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
