import type { UserResponse } from '../../../users/application/mappers/user.mapper';

export interface LoginResponse {
  accessToken: string;
  user: UserResponse;
}

