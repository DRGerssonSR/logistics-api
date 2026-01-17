import type { PackageResponse } from '../../mappers/package.mapper';
import type { PaginatedResult } from '../../../domain/common/pagination';

export interface ListPackagesResponse extends PaginatedResult<PackageResponse> {}

