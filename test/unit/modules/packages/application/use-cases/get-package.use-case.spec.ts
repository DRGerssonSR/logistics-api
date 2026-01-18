import { Test, TestingModule } from '@nestjs/testing';
import { GetPackageUseCase } from 'src/modules/packages/application/use-cases/get-package.use-case';
import type { PackageRepositoryPort } from 'src/modules/packages/domain/ports/package.repository.port';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/user.repository.port';
import { Package } from 'src/modules/packages/domain/entities/package.entity';
import { PackageStatus } from 'src/modules/packages/domain/value-objects/package-status.vo';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserRole } from 'src/modules/users/domain/value-objects/user-role.vo';
import { UserStatus } from 'src/modules/users/domain/value-objects/user-status.vo';
import { PackageNotFoundError } from 'src/modules/packages/domain/errors/package-not-found.error';
import { UnauthorizedPackageAccessError } from 'src/modules/packages/domain/errors/unauthorized-package-access.error';
import { UserNotFoundByIdError } from 'src/modules/users/domain/errors/user-not-found-by-id.error';

describe('GetPackageUseCase', () => {
  let useCase: GetPackageUseCase;
  let mockPackageRepository: jest.Mocked<PackageRepositoryPort>;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;

  const packageId = 'package-id-123';
  const userId = 'user-id-123';
  const otherUserId = 'other-user-id-456';

  const createMockPackage = (
    id: string = packageId,
    ownerId: string = userId,
  ): Package => {
    return Package.create({
      userId: ownerId,
      origin: 'Origin City',
      destination: 'Destination City',
      weight: 5.5,
      dimensions: { length: 10, width: 8, height: 6 },
      status: PackageStatus.PENDING,
    });
  };

  const createMockUser = (id: string = userId): User => {
    const now = new Date();
    return new User({
      id,
      email: 'test@example.com',
      password: 'hashed_password',
      name: 'Test User',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });
  };

  beforeEach(async () => {
    const mockPackageRepositoryPort = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTrackingNumber: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    const mockUserRepositoryPort = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPackageUseCase,
        {
          provide: 'PackageRepositoryPort',
          useValue: mockPackageRepositoryPort,
        },
        {
          provide: 'UserRepositoryPort',
          useValue: mockUserRepositoryPort,
        },
      ],
    }).compile();

    useCase = module.get<GetPackageUseCase>(GetPackageUseCase);
    mockPackageRepository = module.get('PackageRepositoryPort');
    mockUserRepository = module.get('UserRepositoryPort');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should throw PackageNotFoundError when package does not exist', async () => {
      const user = { id: userId, role: UserRole.USER };
      mockPackageRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(packageId, user)).rejects.toThrow(
        PackageNotFoundError,
      );
      expect(mockPackageRepository.findById).toHaveBeenCalledWith(packageId);
    });

    it('should throw UnauthorizedPackageAccessError when USER tries to access another user package', async () => {
      const packageEntity = createMockPackage(packageId, otherUserId);
      const user = { id: userId, role: UserRole.USER };
      mockPackageRepository.findById.mockResolvedValue(packageEntity);

      await expect(useCase.execute(packageId, user)).rejects.toThrow(
        UnauthorizedPackageAccessError,
      );
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should return package successfully when USER accesses own package', async () => {
      const packageEntity = createMockPackage(packageId, userId);
      const owner = createMockUser(userId);
      const user = { id: userId, role: UserRole.USER };

      mockPackageRepository.findById.mockResolvedValue(packageEntity);
      mockUserRepository.findById.mockResolvedValue(owner);

      const result = await useCase.execute(packageId, user);

      expect(mockPackageRepository.findById).toHaveBeenCalledWith(packageId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result.userId).toBe(userId);
      expect(result.owner).toBeDefined();
      expect(result.owner?.id).toBe(userId);
    });

    it('should return package successfully when ADMIN accesses any package', async () => {
      const packageEntity = createMockPackage(packageId, otherUserId);
      const owner = createMockUser(otherUserId);
      const admin = { id: userId, role: UserRole.ADMIN };

      mockPackageRepository.findById.mockResolvedValue(packageEntity);
      mockUserRepository.findById.mockResolvedValue(owner);

      const result = await useCase.execute(packageId, admin);

      expect(mockPackageRepository.findById).toHaveBeenCalledWith(packageId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(otherUserId);
      expect(result.userId).toBe(otherUserId);
      expect(result.owner?.id).toBe(otherUserId);
    });

    it('should throw UserNotFoundByIdError when owner does not exist', async () => {
      const packageEntity = createMockPackage(packageId, userId);
      const user = { id: userId, role: UserRole.USER };

      mockPackageRepository.findById.mockResolvedValue(packageEntity);
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(packageId, user)).rejects.toThrow(
        UserNotFoundByIdError,
      );
    });
  });
});

