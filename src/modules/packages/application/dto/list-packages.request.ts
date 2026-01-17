import type { PaginationParams } from '../../../../shared/domain/common/pagination';
import { UserRole } from '../../../users/domain/value-objects/user-role.vo';

export interface ListPackagesRequest extends PaginationParams {
  userId: string;
  userRole: UserRole;
}

