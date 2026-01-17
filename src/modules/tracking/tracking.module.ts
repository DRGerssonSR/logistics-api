import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateTrackingUseCase } from '../../application/use-cases/tracking/create-tracking.use-case';
import { GetTrackingHistoryUseCase } from '../../application/use-cases/tracking/get-tracking-history.use-case';
import { TrackingRepositoryInMemoryAdapter } from '../../infrastructure/persistence/in-memory/tracking.repository.in-memory.adapter';
import { TrackingRepositoryMongoAdapter } from '../../infrastructure/persistence/mongodb/adapters/tracking.repository.mongo.adapter';
import { TrackingController } from '../../infrastructure/controllers/tracking.controller';
import { SharedModule } from '../shared/shared.module';
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
      useFactory: (
        configService: ConfigService,
        mongoAdapter: TrackingRepositoryMongoAdapter,
      ) => {
        const mongoUri = configService.get<string>('MONGODB_URI');
        
        if (mongoUri && mongoUri.trim() !== '') {
          return mongoAdapter;
        }
        
        return new TrackingRepositoryInMemoryAdapter();
      },
      inject: [ConfigService, TrackingRepositoryMongoAdapter],
    },
  ],
  exports: [
    CreateTrackingUseCase, 
    GetTrackingHistoryUseCase,
    'TrackingRepositoryPort',
  ],
})
export class TrackingModule {}