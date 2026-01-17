import { User } from '../../entities/user.entity';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserRepositoryPort {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findMany(params: PaginationParams): Promise<PaginatedResult<User>>;
}

