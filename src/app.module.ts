import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { SeedsModule } from './modules/seeds/seeds.module';
import { SharedModule } from './modules/shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { PackagesModule } from './modules/packages/packages.module';
import { TrackingModule } from './modules/tracking/tracking.module';

@Module({
  imports: [
    SharedModule,
    UsersModule,
    SeedsModule,
    AuthModule,
    PackagesModule,
    TrackingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
