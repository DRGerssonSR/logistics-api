import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserUseCase } from 'src/modules/users/application/use-cases/create-user.use-case';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/user.repository.port';
import type { PasswordHasherPort } from 'src/shared/domain/ports/password-hasher.port';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserRole } from 'src/modules/users/domain/value-objects/user-role.vo';
import { UserStatus } from 'src/modules/users/domain/value-objects/user-status.vo';
import { UserAlreadyExistsError } from 'src/modules/users/domain/errors/user-already-exists.error';
import { InvalidRoleError } from 'src/modules/users/domain/errors/invalid-role.error';
import { InvalidStatusError } from 'src/modules/users/domain/errors/invalid-status.error';
import type { CreateUserRequest } from 'src/modules/users/application/dto/create-user.request';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;
  let mockPasswordHasher: jest.Mocked<PasswordHasherPort>;

  const createMockUser = (overrides?: Partial<Parameters<typeof User.create>[0]>): User => {
    return User.create({
      email: 'test@example.com',
      password: 'hashed_password',
      name: 'Test User',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      ...overrides,
    });
  };

  const createMockRequest = (overrides?: Partial<CreateUserRequest>): CreateUserRequest => {
    return {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      ...overrides,
    }
  };

  const setupMocks = (userExists = false, hashedPassword = 'hashed_password_123') => {
    mockUserRepository.findByEmail.mockResolvedValue(userExists ? createMockUser() : null);
    mockPasswordHasher.hash.mockResolvedValue(hashedPassword);
  };

  beforeEach(async () => {
    const mockUserRepositoryPort = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
    };

    const mockPasswordHasherPort = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: 'UserRepositoryPort',
          useValue: mockUserRepositoryPort,
        },
        {
          provide: 'PasswordHasherPort',
          useValue: mockPasswordHasherPort,
        },
      ],
    }).compile();

    useCase = module.get<CreateUserUseCase>(CreateUserUseCase);
    mockUserRepository = module.get('UserRepositoryPort');
    mockPasswordHasher = module.get('PasswordHasherPort');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should throw UserAlreadyExistsError when email already exists', async () => {
      const request = createMockRequest();
      setupMocks(true);

      await expect(useCase.execute(request)).rejects.toThrow(UserAlreadyExistsError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(request.email);
      expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InvalidRoleError when role is invalid', async () => {
      const request = createMockRequest({ role: 'INVALID_ROLE' });
      setupMocks(false);

      await expect(useCase.execute(request)).rejects.toThrow(InvalidRoleError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
    });

    it('should throw InvalidStatusError when status is invalid', async () => {
      const request = createMockRequest({ status: 'INVALID_STATUS'});
      setupMocks(false);

      await expect(useCase.execute(request)).rejects.toThrow(InvalidStatusError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
    });

    it('should create user successfully with valid data', async () => {
      const request = createMockRequest();
      const hashedPassword = 'hashed_password_123';
      const createdUser = createMockUser({
        email: request.email,
        password: hashedPassword,
        name: request.name,
        role: request.role as UserRole,
        status: request.status as UserStatus,
      });

      setupMocks(false, hashedPassword);
      mockUserRepository.create.mockResolvedValue(createdUser);

      const result = await useCase.execute(request);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(request.email);
      expect(mockPasswordHasher.hash).toHaveBeenCalledWith(request.password);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(result).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
        status: createdUser.status,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      });
      expect('password' in result).toBe(false);
    });

    it('should create user with ADMIN role successfully', async () => {
      const request = createMockRequest({ role: UserRole.ADMIN });
      const hashedPassword = 'hashed_password_123';
      const createdUser = createMockUser({
        role: UserRole.ADMIN,
        password: hashedPassword,
      });

      setupMocks(false, hashedPassword);
      mockUserRepository.create.mockResolvedValue(createdUser);

      const result = await useCase.execute(request);

      expect(result.role).toBe(UserRole.ADMIN);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should create user with default ACTIVE status when status is not provided', async () => {
      const request = createMockRequest({ status: undefined });
      const hashedPassword = 'hashed_password_123';
      const createdUser = createMockUser({
        password: hashedPassword,
        status: UserStatus.ACTIVE,
      });

      setupMocks(false, hashedPassword);
      mockUserRepository.create.mockResolvedValue(createdUser);

      const result = await useCase.execute(request);

      expect(result.status).toBe(UserStatus.ACTIVE);
    });

    it.each([
      [UserStatus.INACTIVE],
      [UserStatus.BLOCKED],
    ])('should create user with %s status when provided', async (status) => {
      const request = createMockRequest({ status });
      const hashedPassword = 'hashed_password_123';
      const createdUser = createMockUser({
        password: hashedPassword,
        status,
      });

      setupMocks(false, hashedPassword);
      mockUserRepository.create.mockResolvedValue(createdUser);

      const result = await useCase.execute(request);

      expect(result.status).toBe(status);
    });
  });
});

