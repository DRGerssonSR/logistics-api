import { User } from '../../entities/user.entity';
import type { PaginationParams, PaginatedResult } from '../../common/pagination';

export interface UserRepositoryPort {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findMany(params: PaginationParams): Promise<PaginatedResult<User>>;
}

