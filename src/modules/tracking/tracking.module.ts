import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateTrackingUseCase } from './application/use-cases/create-tracking.use-case';
import { GetTrackingHistoryUseCase } from './application/use-cases/get-tracking-history.use-case';
import { TrackingRepositoryMongoAdapter } from './infrastructure/persistence/tracking.repository.mongo.adapter';
import { TrackingController } from './infrastructure/controllers/tracking.controller';
import { SharedModule } from '../../shared/shared.module';
import { PackagesModule } from '../packages/packages.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [SharedModule, PackagesModule, DatabaseModule],
  controllers: [TrackingController],
  providers: [
    CreateTrackingUseCase,
    GetTrackingHistoryUseCase,
    TrackingRepositoryMongoAdapter,
    {
      provide: 'TrackingRepositoryPort',
      useFactory: (mongoAdapter: TrackingRepositoryMongoAdapter) => {
        return mongoAdapter;
      },
      inject: [TrackingRepositoryMongoAdapter],
    },
  ],
  exports: [
    CreateTrackingUseCase, 
    GetTrackingHistoryUseCase,
    'TrackingRepositoryPort',
  ],
})
export class TrackingModule {}