import { Test, TestingModule } from '@nestjs/testing';
import { CreatePackageUseCase } from 'src/modules/packages/application/use-cases/create-package.use-case';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/user.repository.port';
import type { PackageRepositoryPort } from 'src/modules/packages/domain/ports/package.repository.port';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserRole } from 'src/modules/users/domain/value-objects/user-role.vo';
import { UserStatus } from 'src/modules/users/domain/value-objects/user-status.vo';
import { Package } from 'src/modules/packages/domain/entities/package.entity';
import { PackageStatus } from 'src/modules/packages/domain/value-objects/package-status.vo';
import { UserNotFoundByIdError } from 'src/modules/users/domain/errors/user-not-found-by-id.error';
import type { CreatePackageRequest } from 'src/modules/packages/application/dto/create-package.request';

describe('CreatePackageUseCase', () => {
  let useCase: CreatePackageUseCase;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;
  let mockPackageRepository: jest.Mocked<PackageRepositoryPort>;

  const userId = 'user-id-123';

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

  const createMockRequest = (): CreatePackageRequest => {
    return {
      origin: 'Origin City',
      destination: 'Destination City',
      weight: 5.5,
      dimensions: {
        length: 10,
        width: 8,
        height: 6,
      },
    };
  };

  beforeEach(async () => {
    const mockUserRepositoryPort = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
    };

    const mockPackageRepositoryPort = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTrackingNumber: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePackageUseCase,
        {
          provide: 'UserRepositoryPort',
          useValue: mockUserRepositoryPort,
        },
        {
          provide: 'PackageRepositoryPort',
          useValue: mockPackageRepositoryPort,
        },
      ],
    }).compile();

    useCase = module.get<CreatePackageUseCase>(CreatePackageUseCase);
    mockUserRepository = module.get('UserRepositoryPort');
    mockPackageRepository = module.get('PackageRepositoryPort');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should throw UserNotFoundByIdError when user does not exist', async () => {
      const request = createMockRequest();
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(request, userId)).rejects.toThrow(
        UserNotFoundByIdError,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockPackageRepository.create).not.toHaveBeenCalled();
    });

    it('should create package successfully with valid data', async () => {
      const request = createMockRequest();
      const user = createMockUser();
      const createdPackage = Package.create({
        userId,
        origin: request.origin,
        destination: request.destination,
        weight: request.weight,
        dimensions: request.dimensions,
        status: PackageStatus.PENDING,
      });

      mockUserRepository.findById.mockResolvedValue(user);
      mockPackageRepository.create.mockResolvedValue(createdPackage);

      const result = await useCase.execute(request, userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockPackageRepository.create).toHaveBeenCalled();
      expect(result).toEqual({
        id: createdPackage.id,
        trackingNumber: createdPackage.trackingNumber,
        userId: createdPackage.userId,
        origin: createdPackage.origin,
        destination: createdPackage.destination,
        status: createdPackage.status,
        weight: createdPackage.weight,
        dimensions: createdPackage.dimensions,
        createdAt: createdPackage.createdAt,
        updatedAt: createdPackage.updatedAt,
      });
      expect(result.status).toBe(PackageStatus.PENDING);
    });

    it('should create package with correct dimensions', async () => {
      const request = createMockRequest();
      const user = createMockUser();
      const createdPackage = Package.create({
        userId,
        origin: request.origin,
        destination: request.destination,
        weight: request.weight,
        dimensions: request.dimensions,
      });

      mockUserRepository.findById.mockResolvedValue(user);
      mockPackageRepository.create.mockResolvedValue(createdPackage);

      const result = await useCase.execute(request, userId);

      expect(result.dimensions).toEqual(request.dimensions);
      expect(result.weight).toBe(request.weight);
    });

    it('should create package with generated tracking number', async () => {
      const request = createMockRequest();
      const user = createMockUser();
      const createdPackage = Package.create({
        userId,
        origin: request.origin,
        destination: request.destination,
        weight: request.weight,
        dimensions: request.dimensions,
      });

      mockUserRepository.findById.mockResolvedValue(user);
      mockPackageRepository.create.mockResolvedValue(createdPackage);

      const result = await useCase.execute(request, userId);

      expect(result.trackingNumber).toBeDefined();
      expect(result.trackingNumber).toMatch(/^PKG-/);
    });
  });
});

