import type { PaginationParams } from '../../../domain/common/pagination';

export interface ListPackagesRequest extends PaginationParams {
  userId: string;
}

