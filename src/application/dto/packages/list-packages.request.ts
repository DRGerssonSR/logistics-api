import type { PaginationParams } from '../../../domain/common/pagination';
import { UserRole } from '../../../domain/value-objects/user-role.vo';

export interface ListPackagesRequest extends PaginationParams {
  userId: string;
  userRole: UserRole;
}

