import { Test, TestingModule } from '@nestjs/testing';
import { CreateTrackingUseCase } from 'src/modules/tracking/application/use-cases/create-tracking.use-case';
import type { PackageRepositoryPort } from 'src/modules/packages/domain/ports/package.repository.port';
import type { TrackingRepositoryPort } from 'src/modules/tracking/domain/ports/tracking.repository.port';
import { Package } from 'src/modules/packages/domain/entities/package.entity';
import { PackageStatus } from 'src/modules/packages/domain/value-objects/package-status.vo';
import { UserRole } from 'src/modules/users/domain/value-objects/user-role.vo';
import { Tracking } from 'src/modules/tracking/domain/entities/tracking.entity';
import { PackageNotFoundError } from 'src/modules/packages/domain/errors/package-not-found.error';
import { UnauthorizedPackageAccessError } from 'src/modules/packages/domain/errors/unauthorized-package-access.error';
import { InvalidPackageStatusError } from 'src/modules/packages/domain/errors/invalid-package-status.error';
import type { CreateTrackingRequest } from 'src/modules/tracking/application/dto/create-tracking.request';

describe('CreateTrackingUseCase', () => {
  let useCase: CreateTrackingUseCase;
  let mockPackageRepository: jest.Mocked<PackageRepositoryPort>;
  let mockTrackingRepository: jest.Mocked<TrackingRepositoryPort>;

  const packageId = 'package-id-123';
  const userId = 'user-id-123';
  const otherUserId = 'other-user-id-456';

  const createMockPackage = (
    id: string = packageId,
    ownerId: string = userId,
    status: PackageStatus = PackageStatus.PENDING,
  ): Package => {
    const pkg = Package.create({
      userId: ownerId,
      origin: 'Origin City',
      destination: 'Destination City',
      weight: 5.5,
      dimensions: { length: 10, width: 8, height: 6 },
      status: PackageStatus.PENDING,
    });

    if (status !== PackageStatus.PENDING) {
      return pkg.update({ status, updatedAt: new Date() });
    }
    return pkg;
  };

  const createMockRequest = (
    overrides?: Partial<CreateTrackingRequest>,
  ): CreateTrackingRequest => {
    return {
      location: 'Warehouse A',
      status: PackageStatus.IN_TRANSIT,
      notes: 'Package in transit',
      ...overrides,
    };
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

    const mockTrackingRepositoryPort = {
      create: jest.fn(),
      findByPackageId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTrackingUseCase,
        {
          provide: 'PackageRepositoryPort',
          useValue: mockPackageRepositoryPort,
        },
        {
          provide: 'TrackingRepositoryPort',
          useValue: mockTrackingRepositoryPort,
        },
      ],
    }).compile();

    useCase = module.get<CreateTrackingUseCase>(CreateTrackingUseCase);
    mockPackageRepository = module.get('PackageRepositoryPort');
    mockTrackingRepository = module.get('TrackingRepositoryPort');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should throw PackageNotFoundError when package does not exist', async () => {
      const request = createMockRequest();
      const user = { id: userId, role: UserRole.USER };
      mockPackageRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(packageId, request, user)).rejects.toThrow(
        PackageNotFoundError,
      );
      expect(mockPackageRepository.findById).toHaveBeenCalledWith(packageId);
      expect(mockTrackingRepository.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedPackageAccessError when USER tries to create tracking for another user package', async () => {
      const request = createMockRequest();
      const packageEntity = createMockPackage(packageId, otherUserId);
      const user = { id: userId, role: UserRole.USER };
      mockPackageRepository.findById.mockResolvedValue(packageEntity);

      await expect(useCase.execute(packageId, request, user)).rejects.toThrow(
        UnauthorizedPackageAccessError,
      );
      expect(mockTrackingRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InvalidPackageStatusError when status is invalid', async () => {
      const request = createMockRequest({ status: 'INVALID_STATUS' as PackageStatus });
      const packageEntity = createMockPackage(packageId, userId);
      const user = { id: userId, role: UserRole.USER };
      mockPackageRepository.findById.mockResolvedValue(packageEntity);

      await expect(useCase.execute(packageId, request, user)).rejects.toThrow(
        InvalidPackageStatusError,
      );
    });

    it('should create tracking successfully when USER creates tracking for own package', async () => {
      const request = createMockRequest();
      const packageEntity = createMockPackage(packageId, userId);
      const user = { id: userId, role: UserRole.USER };
      const tracking = Tracking.create({
        packageId,
        location: request.location,
        status: request.status,
        notes: request.notes,
      });

      mockPackageRepository.findById.mockResolvedValue(packageEntity);
      mockTrackingRepository.create.mockResolvedValue(tracking);

      const result = await useCase.execute(packageId, request, user);

      expect(mockPackageRepository.findById).toHaveBeenCalledWith(packageId);
      expect(mockTrackingRepository.create).toHaveBeenCalled();
      expect(result).toEqual({
        id: tracking.id,
        packageId: tracking.packageId,
        location: tracking.location,
        status: tracking.status,
        timestamp: tracking.timestamp,
        notes: tracking.notes,
        createdAt: tracking.createdAt,
      });
    });

    it('should create tracking successfully when ADMIN creates tracking for any package', async () => {
      const request = createMockRequest();
      const packageEntity = createMockPackage(packageId, otherUserId);
      const admin = { id: userId, role: UserRole.ADMIN };
      const tracking = Tracking.create({
        packageId,
        location: request.location,
        status: request.status,
        notes: request.notes,
      });

      mockPackageRepository.findById.mockResolvedValue(packageEntity);
      mockTrackingRepository.create.mockResolvedValue(tracking);

      const result = await useCase.execute(packageId, request, admin);

      expect(result.packageId).toBe(packageId);
      expect(result.location).toBe(request.location);
      expect(result.status).toBe(request.status);
    });

    it('should create tracking without notes when notes are not provided', async () => {
      const request = createMockRequest({ notes: undefined });
      const packageEntity = createMockPackage(packageId, userId);
      const user = { id: userId, role: UserRole.USER };
      const tracking = Tracking.create({
        packageId,
        location: request.location,
        status: request.status,
      });

      mockPackageRepository.findById.mockResolvedValue(packageEntity);
      mockTrackingRepository.create.mockResolvedValue(tracking);

      const result = await useCase.execute(packageId, request, user);

      expect(result.notes).toBeUndefined();
    });
  });
});

