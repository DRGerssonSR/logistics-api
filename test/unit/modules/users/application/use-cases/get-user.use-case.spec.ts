import { Test, TestingModule } from '@nestjs/testing';
import { GetUserUseCase } from 'src/modules/users/application/use-cases/get-user.use-case';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/user.repository.port';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserRole } from 'src/modules/users/domain/value-objects/user-role.vo';
import { UserStatus } from 'src/modules/users/domain/value-objects/user-status.vo';
import { UserNotFoundByIdError } from 'src/modules/users/domain/errors/user-not-found-by-id.error';

describe('GetUserUseCase', () => {
  let useCase: GetUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;

  const userId = 'user-id-123';

  const createUserWithId = (
    id: string,
    overrides?: Partial<Parameters<typeof User.create>[0]>,
  ): User => {
    const user = User.create({
      email: 'test@example.com',
      password: 'hashed_password',
      name: 'Test User',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      ...overrides,
    });

    return new User({
      ...user,
      id,
    });
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
        GetUserUseCase,
        {
          provide: 'UserRepositoryPort',
          useValue: mockUserRepositoryPort,
        },
      ],
    }).compile();

    useCase = module.get<GetUserUseCase>(GetUserUseCase);
    mockUserRepository = module.get('UserRepositoryPort');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should throw UserNotFoundByIdError when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(userId)).rejects.toThrow(UserNotFoundByIdError);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should return user successfully when user exists', async () => {
      const user = createUserWithId(userId);
      mockUserRepository.findById.mockResolvedValue(user);

      const result = await useCase.execute(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
      expect('password' in result).toBe(false);
    });

    it('should return user with ADMIN role successfully', async () => {
      const adminUser = createUserWithId(userId, { role: UserRole.ADMIN });
      mockUserRepository.findById.mockResolvedValue(adminUser);

      const result = await useCase.execute(userId);

      expect(result.role).toBe(UserRole.ADMIN);
      expect(result.id).toBe(userId);
    });

    it.each([
      [UserStatus.ACTIVE],
      [UserStatus.INACTIVE],
      [UserStatus.BLOCKED],
    ])('should return user with %s status successfully', async (status) => {
      const user = createUserWithId(userId, { status });
      mockUserRepository.findById.mockResolvedValue(user);

      const result = await useCase.execute(userId);

      expect(result.status).toBe(status);
    });
  });
});

