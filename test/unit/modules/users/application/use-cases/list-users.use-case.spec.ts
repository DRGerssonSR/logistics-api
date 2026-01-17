import { Test, TestingModule } from '@nestjs/testing';
import { ListUsersUseCase } from 'src/modules/users/application/use-cases/list-users.use-case';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/user.repository.port';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserRole } from 'src/modules/users/domain/value-objects/user-role.vo';
import { UserStatus } from 'src/modules/users/domain/value-objects/user-status.vo';
import type { ListUsersRequest } from 'src/modules/users/application/dto/list-users.request';
import type { PaginatedResult } from 'src/shared/domain/common/pagination';

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;

  const createMockUser = (index: number): User => {
    return User.create({
      email: `user${index}@example.com`,
      password: 'hashed_password',
      name: `User ${index}`,
      role: index % 2 === 0 ? UserRole.USER : UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
  };

  const createMockRequest = (overrides?: Partial<ListUsersRequest>): ListUsersRequest => {
    return {
      page: 1,
      limit: 10,
      ...overrides,
    };
  };

  const createPaginatedResult = (
    users: User[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<User> => {
    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  };

  beforeEach(async () => {
    const mockUserRepositoryPort = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListUsersUseCase,
        {
          provide: 'UserRepositoryPort',
          useValue: mockUserRepositoryPort,
        },
      ],
    }).compile();

    useCase = module.get<ListUsersUseCase>(ListUsersUseCase);
    mockUserRepository = module.get('UserRepositoryPort');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return paginated users successfully', async () => {
      const request = createMockRequest();
      const users = Array.from({ length: 3 }, (_, i) => createMockUser(i));
      const paginatedResult = createPaginatedResult(users, 25, 1, 10);

      mockUserRepository.findMany.mockResolvedValue(paginatedResult);

      const result = await useCase.execute(request);

      expect(mockUserRepository.findMany).toHaveBeenCalledWith({
        page: request.page,
        limit: request.limit,
      });
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
      expect('password' in result.data[0]).toBe(false);
    });

    it('should return empty list when no users exist', async () => {
      const request = createMockRequest();
      const paginatedResult = createPaginatedResult([], 0, 1, 10);

      mockUserRepository.findMany.mockResolvedValue(paginatedResult);

      const result = await useCase.execute(request);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle pagination correctly for different pages', async () => {
      const request = createMockRequest({ page: 2, limit: 5 });
      const users = Array.from({ length: 5 }, (_, i) => createMockUser(i));
      const paginatedResult = createPaginatedResult(users, 15, 2, 5);

      mockUserRepository.findMany.mockResolvedValue(paginatedResult);

      const result = await useCase.execute(request);

      expect(mockUserRepository.findMany).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(3);
    });

    it.each([
      [5],
      [10],
      [20],
      [50],
    ])('should handle limit value %d correctly', async (limit) => {
      const request = createMockRequest({ limit });
      const users = Array.from({ length: Math.min(limit, 3) }, (_, i) =>
        createMockUser(i),
      );
      const paginatedResult = createPaginatedResult(users, 10, 1, limit);

      mockUserRepository.findMany.mockResolvedValue(paginatedResult);

      const result = await useCase.execute(request);

      expect(result.limit).toBe(limit);
      expect(mockUserRepository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit,
      });
    });

    it('should map users correctly without password', async () => {
      const request = createMockRequest();
      const users = [
        createMockUser(0),
        createMockUser(1),
        createMockUser(2),
      ];
      const paginatedResult = createPaginatedResult(users, 3, 1, 10);

      mockUserRepository.findMany.mockResolvedValue(paginatedResult);

      const result = await useCase.execute(request);

      result.data.forEach((user) => {
        expect('password' in user).toBe(false);
        expect(user.id).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.name).toBeDefined();
        expect(user.role).toBeDefined();
        expect(user.status).toBeDefined();
      });
    });
  });
});

