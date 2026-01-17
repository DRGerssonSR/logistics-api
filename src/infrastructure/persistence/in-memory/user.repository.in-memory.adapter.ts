import { Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import type {
  UserRepositoryPort,
  PaginationParams,
  PaginatedResult,
} from '../../../domain/ports/output/user.repository.port';

@Injectable()
export class UserRepositoryInMemoryAdapter implements UserRepositoryPort {
  private users: Map<string, User> = new Map();

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(
      (u) => u.email === email,
    );
    return user || null;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user || null;
  }

  async findMany(params: PaginationParams): Promise<PaginatedResult<User>> {
    const { page, limit } = params;
    const allUsers = Array.from(this.users.values());
    
    const total = allUsers.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
 
    const paginatedUsers = allUsers.slice(skip, skip + limit);
    
    return {
      data: paginatedUsers,
      total,
      page,
      limit,
      totalPages,
    };
  }
}

