import { Module } from '@nestjs/common';
import { CreateTrackingUseCase } from '../../application/use-cases/tracking/create-tracking.use-case';
import { GetTrackingHistoryUseCase } from '../../application/use-cases/tracking/get-tracking-history.use-case';
import { TrackingRepositoryInMemoryAdapter } from '../../infrastructure/persistence/in-memory/tracking.repository.in-memory.adapter';
import { TrackingController } from '../../infrastructure/controllers/tracking.controller';
import { SharedModule } from '../shared/shared.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
  imports: [SharedModule, PackagesModule],
  controllers: [TrackingController],
  providers: [
    CreateTrackingUseCase,
    GetTrackingHistoryUseCase,
    {
      provide: 'TrackingRepositoryPort',
      useClass: TrackingRepositoryInMemoryAdapter,
    },
  ],
  exports: [CreateTrackingUseCase, GetTrackingHistoryUseCase],
})
export class TrackingModule {}

