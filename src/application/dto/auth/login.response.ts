import type { UserResponse } from '../../mappers/user.mapper';

export interface LoginResponse {
  accessToken: string;
  user: UserResponse;
}

