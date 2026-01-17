import type { UserResponse } from '../../mappers/user.mapper';

export interface ListUsersResponse {
  data: UserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

