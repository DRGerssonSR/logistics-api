import { User } from '../../domain/entities/user.entity';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserMapper {
  static toResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static toResponseList(users: User[]): UserResponse[] {
    return users.map((user) => this.toResponse(user));
  }
}

