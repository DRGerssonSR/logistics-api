import type { PackageResponse } from '../mappers/package.mapper';
import type { PaginatedResult } from '../../../../shared/domain/common/pagination';

export interface ListPackagesResponse extends PaginatedResult<PackageResponse> {}

