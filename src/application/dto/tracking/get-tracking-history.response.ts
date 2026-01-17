import type { TrackingResponse } from '../../mappers/tracking.mapper';

export interface GetTrackingHistoryResponse {
  packageId: string;
  events: TrackingResponse[];
}

