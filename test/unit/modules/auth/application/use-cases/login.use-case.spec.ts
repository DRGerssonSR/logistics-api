import { Test, TestingModule } from '@nestjs/testing';
import { LoginUseCase } from 'src/modules/auth/application/use-cases/login.use-case';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/user.repository.port';
import type { PasswordHasherPort } from 'src/shared/domain/ports/password-hasher.port';
import type { TokenGeneratorPort } from 'src/shared/domain/ports/token-generator.port';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserRole } from 'src/modules/users/domain/value-objects/user-role.vo';
import { UserStatus } from 'src/modules/users/domain/value-objects/user-status.vo';
import { InvalidCredentialsError } from 'src/modules/auth/domain/errors/invalid-credentials.error';
import { UserNotFoundError } from 'src/modules/users/domain/errors/user-not-found.error';
import type { LoginRequest } from 'src/modules/auth/application/dto/login.request';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;
  let mockPasswordHasher: jest.Mocked<PasswordHasherPort>;
  let mockTokenGenerator: jest.Mocked<TokenGeneratorPort>;

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

  const createMockRequest = (overrides?: Partial<LoginRequest>): LoginRequest => {
    return {
      email: 'test@example.com',
      password: 'password123',
      ...overrides,
    };
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

    const mockTokenGeneratorPort = {
      generate: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: 'UserRepositoryPort',
          useValue: mockUserRepositoryPort,
        },
        {
          provide: 'PasswordHasherPort',
          useValue: mockPasswordHasherPort,
        },
        {
          provide: 'TokenGeneratorPort',
          useValue: mockTokenGeneratorPort,
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    mockUserRepository = module.get('UserRepositoryPort');
    mockPasswordHasher = module.get('PasswordHasherPort');
    mockTokenGenerator = module.get('TokenGeneratorPort');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should throw UserNotFoundError when user does not exist', async () => {
      const request = createMockRequest();
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(request)).rejects.toThrow(UserNotFoundError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(request.email);
      expect(mockPasswordHasher.compare).not.toHaveBeenCalled();
      expect(mockTokenGenerator.generate).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsError when password is incorrect', async () => {
      const request = createMockRequest();
      const user = createMockUser({ email: request.email });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPasswordHasher.compare.mockResolvedValue(false);

      await expect(useCase.execute(request)).rejects.toThrow(InvalidCredentialsError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(request.email);
      expect(mockPasswordHasher.compare).toHaveBeenCalledWith(
        request.password,
        user.password,
      );
      expect(mockTokenGenerator.generate).not.toHaveBeenCalled();
    });

    it('should return access token and user on successful login', async () => {
      const request = createMockRequest();
      const user = createMockUser({ email: request.email });
      const accessToken = 'mock_access_token_123';

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockTokenGenerator.generate.mockResolvedValue(accessToken);

      const result = await useCase.execute(request);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(request.email);
      expect(mockPasswordHasher.compare).toHaveBeenCalledWith(
        request.password,
        user.password,
      );
      expect(mockTokenGenerator.generate).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      expect(result.accessToken).toBe(accessToken);
      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
      expect('password' in result.user).toBe(false);
    });

    it.each([
      [UserRole.USER],
      [UserRole.ADMIN],
    ])('should generate token with correct role for %s', async (role) => {
      const request = createMockRequest();
      const user = createMockUser({ email: request.email, role });
      const accessToken = 'mock_access_token_123';

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockTokenGenerator.generate.mockResolvedValue(accessToken);

      const result = await useCase.execute(request);

      expect(mockTokenGenerator.generate).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      expect(result.user.role).toBe(role);
    });
  });
});

