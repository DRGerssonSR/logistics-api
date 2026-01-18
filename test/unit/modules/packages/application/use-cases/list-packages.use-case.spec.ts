import { Test, TestingModule } from '@nestjs/testing';
import { ListPackagesUseCase } from 'src/modules/packages/application/use-cases/list-packages.use-case';
import type { PackageRepositoryPort } from 'src/modules/packages/domain/ports/package.repository.port';
import { Package } from 'src/modules/packages/domain/entities/package.entity';
import { PackageStatus } from 'src/modules/packages/domain/value-objects/package-status.vo';
import { UserRole } from 'src/modules/users/domain/value-objects/user-role.vo';
import type { ListPackagesRequest } from 'src/modules/packages/application/dto/list-packages.request';
import type { PaginatedResult } from 'src/shared/domain/common/pagination';

describe('ListPackagesUseCase', () => {
  let useCase: ListPackagesUseCase;
  let mockPackageRepository: jest.Mocked<PackageRepositoryPort>;

  const userId = 'user-id-123';

  const createMockPackage = (index: number, ownerId: string = userId): Package => {
    return Package.create({
      userId: ownerId,
      origin: `Origin ${index}`,
      destination: `Destination ${index}`,
      weight: 5.5 + index,
      dimensions: { length: 10, width: 8, height: 6 },
      status: index % 3 === 0
        ? PackageStatus.PENDING
        : index % 3 === 1
          ? PackageStatus.IN_TRANSIT
          : PackageStatus.DELIVERED,
    });
  };

  const createMockRequest = (
    userRole: UserRole,
    overrides?: Partial<ListPackagesRequest>,
  ): ListPackagesRequest => {
    return {
      userId,
      userRole,
      page: 1,
      limit: 10,
      ...overrides,
    };
  };

  const createPaginatedResult = (
    packages: Package[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<Package> => {
    return {
      data: packages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListPackagesUseCase,
        {
          provide: 'PackageRepositoryPort',
          useValue: mockPackageRepositoryPort,
        },
      ],
    }).compile();

    useCase = module.get<ListPackagesUseCase>(ListPackagesUseCase);
    mockPackageRepository = module.get('PackageRepositoryPort');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all packages when user is ADMIN', async () => {
      const request = createMockRequest(UserRole.ADMIN);
      const packages = Array.from({ length: 3 }, (_, i) => createMockPackage(i));
      const paginatedResult = createPaginatedResult(packages, 25, 1, 10);

      mockPackageRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await useCase.execute(request);

      expect(mockPackageRepository.findAll).toHaveBeenCalledWith({
        page: request.page,
        limit: request.limit,
      });
      expect(mockPackageRepository.findByUserId).not.toHaveBeenCalled();
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(25);
    });

    it('should return only user packages when user is USER', async () => {
      const request = createMockRequest(UserRole.USER);
      const packages = Array.from({ length: 2 }, (_, i) => createMockPackage(i, userId));
      const paginatedResult = createPaginatedResult(packages, 5, 1, 10);

      mockPackageRepository.findByUserId.mockResolvedValue(paginatedResult);

      const result = await useCase.execute(request);

      expect(mockPackageRepository.findByUserId).toHaveBeenCalledWith(userId, {
        page: request.page,
        limit: request.limit,
      });
      expect(mockPackageRepository.findAll).not.toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(5);
    });

    it('should return empty list when no packages exist', async () => {
      const request = createMockRequest(UserRole.USER);
      const paginatedResult = createPaginatedResult([], 0, 1, 10);

      mockPackageRepository.findByUserId.mockResolvedValue(paginatedResult);

      const result = await useCase.execute(request);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle pagination correctly for ADMIN', async () => {
      const request = createMockRequest(UserRole.ADMIN, { page: 2, limit: 5 });
      const packages = Array.from({ length: 5 }, (_, i) => createMockPackage(i));
      const paginatedResult = createPaginatedResult(packages, 15, 2, 5);

      mockPackageRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await useCase.execute(request);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(3);
    });

    it('should handle pagination correctly for USER', async () => {
      const request = createMockRequest(UserRole.USER, { page: 2, limit: 5 });
      const packages = Array.from({ length: 5 }, (_, i) => createMockPackage(i, userId));
      const paginatedResult = createPaginatedResult(packages, 12, 2, 5);

      mockPackageRepository.findByUserId.mockResolvedValue(paginatedResult);

      const result = await useCase.execute(request);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(3);
    });
  });
});

