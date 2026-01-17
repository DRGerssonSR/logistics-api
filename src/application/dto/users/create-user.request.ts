export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: string;
  status?: string;
}

