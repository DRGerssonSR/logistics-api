import { Test, TestingModule } from '@nestjs/testing';
import { UpdatePackageStatusUseCase } from 'src/modules/packages/application/use-cases/update-package-status.use-case';
import type { PackageRepositoryPort } from 'src/modules/packages/domain/ports/package.repository.port';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/user.repository.port';
import { Package } from 'src/modules/packages/domain/entities/package.entity';
import { PackageStatus } from 'src/modules/packages/domain/value-objects/package-status.vo';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserRole } from 'src/modules/users/domain/value-objects/user-role.vo';
import { UserStatus } from 'src/modules/users/domain/value-objects/user-status.vo';
import { PackageNotFoundError } from 'src/modules/packages/domain/errors/package-not-found.error';
import { InvalidPackageStatusError } from 'src/modules/packages/domain/errors/invalid-package-status.error';
import { InvalidStatusTransitionError } from 'src/modules/packages/domain/errors/invalid-status-transition.error';
import { UserNotFoundByIdError } from 'src/modules/users/domain/errors/user-not-found-by-id.error';
import type { UpdatePackageStatusRequest } from 'src/modules/packages/application/dto/update-package-status.request';

describe('UpdatePackageStatusUseCase', () => {
  let useCase: UpdatePackageStatusUseCase;
  let mockPackageRepository: jest.Mocked<PackageRepositoryPort>;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;

  const packageId = 'package-id-123';
  const userId = 'user-id-123';

  const createMockPackage = (
    id: string = packageId,
    status: PackageStatus = PackageStatus.PENDING,
  ): Package => {
    const pkg = Package.create({
      userId,
      origin: 'Origin City',
      destination: 'Destination City',
      weight: 5.5,
      dimensions: { length: 10, width: 8, height: 6 },
      status: PackageStatus.PENDING,
    });

    if (status !== PackageStatus.PENDING) {
      const updated = pkg.update({ status, updatedAt: new Date() });
      return Object.assign(Object.create(Package.prototype), {
        ...updated,
        id: pkg.id,
        trackingNumber: pkg.trackingNumber,
      }) as Package;
    }
    return pkg;
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

  const createMockRequest = (status: PackageStatus): UpdatePackageStatusRequest => {
    return { status };
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
        UpdatePackageStatusUseCase,
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

    useCase = module.get<UpdatePackageStatusUseCase>(UpdatePackageStatusUseCase);
    mockPackageRepository = module.get('PackageRepositoryPort');
    mockUserRepository = module.get('UserRepositoryPort');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should throw error when user is not ADMIN', async () => {
      const request = createMockRequest(PackageStatus.IN_TRANSIT);
      const user = { id: userId, role: UserRole.USER };

      await expect(useCase.execute(packageId, request, user)).rejects.toThrow(
        'Only administrators can update package status',
      );
      expect(mockPackageRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw PackageNotFoundError when package does not exist', async () => {
      const request = createMockRequest(PackageStatus.IN_TRANSIT);
      const admin = { id: userId, role: UserRole.ADMIN };
      mockPackageRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(packageId, request, admin)).rejects.toThrow(
        PackageNotFoundError,
      );
      expect(mockPackageRepository.findById).toHaveBeenCalledWith(packageId);
    });

    it('should throw InvalidPackageStatusError when status is invalid', async () => {
      const request = { status: 'INVALID_STATUS' as PackageStatus };
      const admin = { id: userId, role: UserRole.ADMIN };
      const packageEntity = createMockPackage();

      mockPackageRepository.findById.mockResolvedValue(packageEntity);

      await expect(useCase.execute(packageId, request, admin)).rejects.toThrow(
        InvalidPackageStatusError,
      );
    });

    it('should update status successfully from PENDING to IN_TRANSIT', async () => {
      const request = createMockRequest(PackageStatus.IN_TRANSIT);
      const admin = { id: userId, role: UserRole.ADMIN };
      const packageEntity = createMockPackage(packageId, PackageStatus.PENDING);
      const updatedPackage = packageEntity.update({
        status: PackageStatus.IN_TRANSIT,
        updatedAt: new Date(),
      });
      const owner = createMockUser();

      mockPackageRepository.findById.mockResolvedValue(packageEntity);
      mockPackageRepository.update.mockResolvedValue(updatedPackage);
      mockUserRepository.findById.mockResolvedValue(owner);

      const result = await useCase.execute(packageId, request, admin);

      expect(mockPackageRepository.update).toHaveBeenCalled();
      expect(result.status).toBe(PackageStatus.IN_TRANSIT);
      expect(result.owner).toBeDefined();
    });

    it('should update status successfully from IN_TRANSIT to DELIVERED', async () => {
      const request = createMockRequest(PackageStatus.DELIVERED);
      const admin = { id: userId, role: UserRole.ADMIN };
      const packageEntity = createMockPackage(packageId, PackageStatus.IN_TRANSIT);
      const updatedPackage = packageEntity.update({
        status: PackageStatus.DELIVERED,
        updatedAt: new Date(),
      });
      const owner = createMockUser();

      mockPackageRepository.findById.mockResolvedValue(packageEntity);
      mockPackageRepository.update.mockResolvedValue(updatedPackage);
      mockUserRepository.findById.mockResolvedValue(owner);

      const result = await useCase.execute(packageId, request, admin);

      expect(result.status).toBe(PackageStatus.DELIVERED);
    });

    it('should allow keeping same status', async () => {
      const request = createMockRequest(PackageStatus.PENDING);
      const admin = { id: userId, role: UserRole.ADMIN };
      const packageEntity = createMockPackage(packageId, PackageStatus.PENDING);
      const owner = createMockUser();

      mockPackageRepository.findById.mockResolvedValue(packageEntity);
      mockPackageRepository.update.mockResolvedValue(packageEntity);
      mockUserRepository.findById.mockResolvedValue(owner);

      const result = await useCase.execute(packageId, request, admin);

      expect(result.status).toBe(PackageStatus.PENDING);
    });

    it('should throw InvalidStatusTransitionError when trying to go backwards from IN_TRANSIT to PENDING', async () => {
      const request = createMockRequest(PackageStatus.PENDING);
      const admin = { id: userId, role: UserRole.ADMIN };
      const packageEntity = createMockPackage(packageId, PackageStatus.IN_TRANSIT);

      mockPackageRepository.findById.mockResolvedValue(packageEntity);

      await expect(useCase.execute(packageId, request, admin)).rejects.toThrow(
        InvalidStatusTransitionError,
      );
      expect(mockPackageRepository.update).not.toHaveBeenCalled();
    });

    it('should throw InvalidStatusTransitionError when trying to change from DELIVERED', async () => {
      const request = createMockRequest(PackageStatus.IN_TRANSIT);
      const admin = { id: userId, role: UserRole.ADMIN };
      const packageEntity = createMockPackage(packageId, PackageStatus.DELIVERED);

      mockPackageRepository.findById.mockResolvedValue(packageEntity);

      await expect(useCase.execute(packageId, request, admin)).rejects.toThrow(
        InvalidStatusTransitionError,
      );
    });

    it('should throw InvalidStatusTransitionError when trying to skip status from PENDING to DELIVERED', async () => {
      const request = createMockRequest(PackageStatus.DELIVERED);
      const admin = { id: userId, role: UserRole.ADMIN };
      const packageEntity = createMockPackage(packageId, PackageStatus.PENDING);

      mockPackageRepository.findById.mockResolvedValue(packageEntity);

      await expect(useCase.execute(packageId, request, admin)).rejects.toThrow(
        InvalidStatusTransitionError,
      );
    });

    it('should throw UserNotFoundByIdError when owner does not exist', async () => {
      const request = createMockRequest(PackageStatus.IN_TRANSIT);
      const admin = { id: userId, role: UserRole.ADMIN };
      const packageEntity = createMockPackage(packageId, PackageStatus.PENDING);
      const updatedPackage = packageEntity.update({
        status: PackageStatus.IN_TRANSIT,
        updatedAt: new Date(),
      });

      mockPackageRepository.findById.mockResolvedValue(packageEntity);
      mockPackageRepository.update.mockResolvedValue(updatedPackage);
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(packageId, request, admin)).rejects.toThrow(
        UserNotFoundByIdError,
      );
    });
  });
});

