import { Test, TestingModule } from '@nestjs/testing';
import { GetTrackingHistoryUseCase } from 'src/modules/tracking/application/use-cases/get-tracking-history.use-case';
import type { PackageRepositoryPort } from 'src/modules/packages/domain/ports/package.repository.port';
import type { TrackingRepositoryPort } from 'src/modules/tracking/domain/ports/tracking.repository.port';
import { Package } from 'src/modules/packages/domain/entities/package.entity';
import { PackageStatus } from 'src/modules/packages/domain/value-objects/package-status.vo';
import { UserRole } from 'src/modules/users/domain/value-objects/user-role.vo';
import { Tracking } from 'src/modules/tracking/domain/entities/tracking.entity';
import { PackageNotFoundError } from 'src/modules/packages/domain/errors/package-not-found.error';
import { UnauthorizedPackageAccessError } from 'src/modules/packages/domain/errors/unauthorized-package-access.error';
import { TrackingNotFoundError } from 'src/modules/tracking/domain/errors/tracking-not-found.error';

describe('GetTrackingHistoryUseCase', () => {
  let useCase: GetTrackingHistoryUseCase;
  let mockPackageRepository: jest.Mocked<PackageRepositoryPort>;
  let mockTrackingRepository: jest.Mocked<TrackingRepositoryPort>;

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

  const createMockTracking = (
    index: number,
    pkgId: string = packageId,
  ): Tracking => {
    const baseDate = new Date();
    baseDate.setHours(baseDate.getHours() - index);
    return Tracking.create({
      packageId: pkgId,
      location: `Location ${index}`,
      status:
        index === 0
          ? PackageStatus.DELIVERED
          : index === 1
            ? PackageStatus.IN_TRANSIT
            : PackageStatus.PENDING,
      notes: `Note ${index}`,
      timestamp: baseDate,
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

    const mockTrackingRepositoryPort = {
      create: jest.fn(),
      findByPackageId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTrackingHistoryUseCase,
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

    useCase = module.get<GetTrackingHistoryUseCase>(GetTrackingHistoryUseCase);
    mockPackageRepository = module.get('PackageRepositoryPort');
    mockTrackingRepository = module.get('TrackingRepositoryPort');
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
      expect(mockTrackingRepository.findByPackageId).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedPackageAccessError when USER tries to access another user package tracking', async () => {
      const packageEntity = createMockPackage(packageId, otherUserId);
      const user = { id: userId, role: UserRole.USER };
      mockPackageRepository.findById.mockResolvedValue(packageEntity);

      await expect(useCase.execute(packageId, user)).rejects.toThrow(
        UnauthorizedPackageAccessError,
      );
      expect(mockTrackingRepository.findByPackageId).not.toHaveBeenCalled();
    });

    it('should throw TrackingNotFoundError when no tracking events exist', async () => {
      const packageEntity = createMockPackage(packageId, userId);
      const user = { id: userId, role: UserRole.USER };
      mockPackageRepository.findById.mockResolvedValue(packageEntity);
      mockTrackingRepository.findByPackageId.mockResolvedValue([]);

      await expect(useCase.execute(packageId, user)).rejects.toThrow(
        TrackingNotFoundError,
      );
      expect(mockTrackingRepository.findByPackageId).toHaveBeenCalledWith(
        packageId,
      );
    });

    it('should return tracking history sorted by timestamp descending', async () => {
      const packageEntity = createMockPackage(packageId, userId);
      const user = { id: userId, role: UserRole.USER };
      const trackings = [
        createMockTracking(2),
        createMockTracking(0),
        createMockTracking(1),
      ];
      mockPackageRepository.findById.mockResolvedValue(packageEntity);
      mockTrackingRepository.findByPackageId.mockResolvedValue(trackings);

      const result = await useCase.execute(packageId, user);

      expect(result.packageId).toBe(packageId);
      expect(result.events).toHaveLength(3);
      expect(result.events[0].timestamp.getTime()).toBeGreaterThan(
        result.events[1].timestamp.getTime(),
      );
      expect(result.events[1].timestamp.getTime()).toBeGreaterThan(
        result.events[2].timestamp.getTime(),
      );
    });

    it('should return tracking history successfully when USER accesses own package', async () => {
      const packageEntity = createMockPackage(packageId, userId);
      const user = { id: userId, role: UserRole.USER };
      const trackings = [
        createMockTracking(0),
        createMockTracking(1),
      ];
      mockPackageRepository.findById.mockResolvedValue(packageEntity);
      mockTrackingRepository.findByPackageId.mockResolvedValue(trackings);

      const result = await useCase.execute(packageId, user);

      expect(mockPackageRepository.findById).toHaveBeenCalledWith(packageId);
      expect(mockTrackingRepository.findByPackageId).toHaveBeenCalledWith(
        packageId,
      );
      expect(result.events).toHaveLength(2);
      expect(result.events[0].packageId).toBe(packageId);
    });

    it('should return tracking history successfully when ADMIN accesses any package', async () => {
      const packageEntity = createMockPackage(packageId, otherUserId);
      const admin = { id: userId, role: UserRole.ADMIN };
      const trackings = [createMockTracking(0)];
      mockPackageRepository.findById.mockResolvedValue(packageEntity);
      mockTrackingRepository.findByPackageId.mockResolvedValue(trackings);

      const result = await useCase.execute(packageId, admin);

      expect(result.packageId).toBe(packageId);
      expect(result.events).toHaveLength(1);
    });
  });
});

