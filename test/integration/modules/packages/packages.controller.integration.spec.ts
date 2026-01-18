import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupTestApp } from '../../../setup/integration.setup';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/modules/users/infrastructure/persistence/user.entity.sql';
import { PackageEntity } from 'src/modules/packages/infrastructure/persistence/package.entity.sql';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/modules/users/domain/value-objects/user-role.vo';
import { UserStatus } from 'src/modules/users/domain/value-objects/user-status.vo';
import { PackageStatus } from 'src/modules/packages/domain/value-objects/package-status.vo';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { Package } from 'src/modules/packages/domain/entities/package.entity';
import type { PasswordHasherPort } from 'src/shared/domain/ports/password-hasher.port';

describe('PackagesController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<UserEntity>;
  let packageRepository: Repository<PackageEntity>;
  let jwtService: JwtService;
  let passwordHasher: PasswordHasherPort;
  let adminToken: string;
  let userToken: string;
  let adminUser: User;
  let regularUser: User;

  beforeAll(async () => {
    const { app: testApp, moduleFixture } = await createTestApp();
    app = testApp;
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
    packageRepository = moduleFixture.get(getRepositoryToken(PackageEntity));
    jwtService = moduleFixture.get(JwtService);
    passwordHasher = moduleFixture.get('PasswordHasherPort');

    // Crear usuario admin para los tests
    const adminPassword = await passwordHasher.hash('admin123');
    adminUser = User.create({
      email: 'admin@packages.com',
      password: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save({
      id: adminUser.id,
      email: adminUser.email,
      password: adminUser.password,
      name: adminUser.name,
      role: adminUser.role,
      status: adminUser.status,
      createdAt: adminUser.createdAt,
      updatedAt: adminUser.updatedAt,
    });

    // Crear usuario regular para los tests
    const userPassword = await passwordHasher.hash('user123');
    regularUser = User.create({
      email: 'user@packages.com',
      password: userPassword,
      name: 'Regular User',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save({
      id: regularUser.id,
      email: regularUser.email,
      password: regularUser.password,
      name: regularUser.name,
      role: regularUser.role,
      status: regularUser.status,
      createdAt: regularUser.createdAt,
      updatedAt: regularUser.updatedAt,
    });

    // Generar tokens JWT
    adminToken = await jwtService.signAsync({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    userToken = await jwtService.signAsync({
      sub: regularUser.id,
      email: regularUser.email,
      role: regularUser.role,
    });
  });

  afterAll(async () => {
    await cleanupTestApp();
  });

  beforeEach(async () => {
    // Limpiar datos entre tests (excepto los usuarios base)
    await packageRepository.clear();
    const allUsers = await userRepository.find();
    for (const user of allUsers) {
      if (user.email !== 'admin@packages.com' && user.email !== 'user@packages.com') {
        await userRepository.remove(user);
      }
    }
  });

  describe('POST /api/v1/packages', () => {
    it('should create a package successfully', async () => {
      const createPackageDto = {
        origin: 'Ciudad de México',
        destination: 'Guadalajara',
        weight: 5.5,
        dimensions: {
          length: 1.5,
          width: 1.0,
          height: 0.5,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/packages')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createPackageDto)
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('trackingNumber');
      expect(response.body.data.origin).toBe(createPackageDto.origin);
      expect(response.body.data.destination).toBe(createPackageDto.destination);
      expect(response.body.data.weight).toBe(createPackageDto.weight);
      expect(response.body.data.dimensions).toEqual(createPackageDto.dimensions);
      expect(response.body.data.status).toBe(PackageStatus.PENDING);
      expect(response.body.data.userId).toBe(regularUser.id);
      expect(response.body.data.trackingNumber).toMatch(/^PKG-/);
    });

    it('should return 401 when no token is provided', async () => {
      const createPackageDto = {
        origin: 'Ciudad de México',
        destination: 'Guadalajara',
        weight: 5.5,
        dimensions: {
          length: 1.5,
          width: 1.0,
          height: 0.5,
        },
      };

      await request(app.getHttpServer())
        .post('/api/v1/packages')
        .send(createPackageDto)
        .expect(401);
    });

    it('should return 400 when DTO validation fails (missing origin)', async () => {
      const createPackageDto = {
        destination: 'Guadalajara',
        weight: 5.5,
        dimensions: {
          length: 1.5,
          width: 1.0,
          height: 0.5,
        },
      };

      await request(app.getHttpServer())
        .post('/api/v1/packages')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createPackageDto)
        .expect(400);
    });

    it('should return 400 when weight is too small', async () => {
      const createPackageDto = {
        origin: 'Ciudad de México',
        destination: 'Guadalajara',
        weight: 0.05, // Menor que 0.1
        dimensions: {
          length: 1.5,
          width: 1.0,
          height: 0.5,
        },
      };

      await request(app.getHttpServer())
        .post('/api/v1/packages')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createPackageDto)
        .expect(400);
    });

    it('should return 400 when dimensions are invalid', async () => {
      const createPackageDto = {
        origin: 'Ciudad de México',
        destination: 'Guadalajara',
        weight: 5.5,
        dimensions: {
          length: 0.05, // Menor que 0.1
          width: 1.0,
          height: 0.5,
        },
      };

      await request(app.getHttpServer())
        .post('/api/v1/packages')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createPackageDto)
        .expect(400);
    });
  });

  describe('GET /api/v1/packages', () => {
    it('should return paginated list of packages for USER (only their packages)', async () => {
      // Crear paquetes para el usuario regular
      for (let i = 0; i < 3; i++) {
        const pkg = Package.create({
          userId: regularUser.id,
          origin: `Origin ${i}`,
          destination: `Destination ${i}`,
          weight: 5.5,
          dimensions: { length: 1.5, width: 1.0, height: 0.5 },
        });
        await packageRepository.save({
          id: pkg.id,
          trackingNumber: pkg.trackingNumber,
          userId: pkg.userId,
          origin: pkg.origin,
          destination: pkg.destination,
          status: pkg.status,
          weight: pkg.weight,
          dimensions: pkg.dimensions,
          createdAt: pkg.createdAt,
          updatedAt: pkg.updatedAt,
        });
      }

      // Crear paquete para otro usuario (no debería aparecer)
      const otherPkg = Package.create({
        userId: adminUser.id,
        origin: 'Other Origin',
        destination: 'Other Destination',
        weight: 5.5,
        dimensions: { length: 1.5, width: 1.0, height: 0.5 },
      });
      await packageRepository.save({
        id: otherPkg.id,
        trackingNumber: otherPkg.trackingNumber,
        userId: otherPkg.userId,
        origin: otherPkg.origin,
        destination: otherPkg.destination,
        status: otherPkg.status,
        weight: otherPkg.weight,
        dimensions: otherPkg.dimensions,
        createdAt: otherPkg.createdAt,
        updatedAt: otherPkg.updatedAt,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/packages')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data.total).toBe(3); // Solo los del usuario regular
      expect(response.body.data.data.length).toBe(3);
      response.body.data.data.forEach((pkg: any) => {
        expect(pkg.userId).toBe(regularUser.id);
      });
    });

    it('should return all packages for ADMIN', async () => {
      // Crear paquetes para ambos usuarios
      for (let i = 0; i < 2; i++) {
        const pkg = Package.create({
          userId: regularUser.id,
          origin: `Origin ${i}`,
          destination: `Destination ${i}`,
          weight: 5.5,
          dimensions: { length: 1.5, width: 1.0, height: 0.5 },
        });
        await packageRepository.save({
          id: pkg.id,
          trackingNumber: pkg.trackingNumber,
          userId: pkg.userId,
          origin: pkg.origin,
          destination: pkg.destination,
          status: pkg.status,
          weight: pkg.weight,
          dimensions: pkg.dimensions,
          createdAt: pkg.createdAt,
          updatedAt: pkg.updatedAt,
        });
      }

      const adminPkg = Package.create({
        userId: adminUser.id,
        origin: 'Admin Origin',
        destination: 'Admin Destination',
        weight: 5.5,
        dimensions: { length: 1.5, width: 1.0, height: 0.5 },
      });
      await packageRepository.save({
        id: adminPkg.id,
        trackingNumber: adminPkg.trackingNumber,
        userId: adminPkg.userId,
        origin: adminPkg.origin,
        destination: adminPkg.destination,
        status: adminPkg.status,
        weight: adminPkg.weight,
        dimensions: adminPkg.dimensions,
        createdAt: adminPkg.createdAt,
        updatedAt: adminPkg.updatedAt,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/packages')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data.total).toBeGreaterThanOrEqual(3); // Todos los paquetes
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/packages')
        .expect(401);
    });
  });

  describe('GET /api/v1/packages/:id', () => {
    it('should return package by id for owner', async () => {
      const pkg = Package.create({
        userId: regularUser.id,
        origin: 'Origin',
        destination: 'Destination',
        weight: 5.5,
        dimensions: { length: 1.5, width: 1.0, height: 0.5 },
      });
      await packageRepository.save({
        id: pkg.id,
        trackingNumber: pkg.trackingNumber,
        userId: pkg.userId,
        origin: pkg.origin,
        destination: pkg.destination,
        status: pkg.status,
        weight: pkg.weight,
        dimensions: pkg.dimensions,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/packages/${pkg.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(pkg.id);
      expect(response.body.data.trackingNumber).toBe(pkg.trackingNumber);
    });

    it('should return 403 when USER tries to access another user package', async () => {
      const pkg = Package.create({
        userId: adminUser.id,
        origin: 'Origin',
        destination: 'Destination',
        weight: 5.5,
        dimensions: { length: 1.5, width: 1.0, height: 0.5 },
      });
      await packageRepository.save({
        id: pkg.id,
        trackingNumber: pkg.trackingNumber,
        userId: pkg.userId,
        origin: pkg.origin,
        destination: pkg.destination,
        status: pkg.status,
        weight: pkg.weight,
        dimensions: pkg.dimensions,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
      });

      await request(app.getHttpServer())
        .get(`/api/v1/packages/${pkg.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return package by id for ADMIN (any package)', async () => {
      const pkg = Package.create({
        userId: regularUser.id,
        origin: 'Origin',
        destination: 'Destination',
        weight: 5.5,
        dimensions: { length: 1.5, width: 1.0, height: 0.5 },
      });
      await packageRepository.save({
        id: pkg.id,
        trackingNumber: pkg.trackingNumber,
        userId: pkg.userId,
        origin: pkg.origin,
        destination: pkg.destination,
        status: pkg.status,
        weight: pkg.weight,
        dimensions: pkg.dimensions,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/packages/${pkg.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(pkg.id);
    });

    it('should return 404 when package not found', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/v1/packages/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should return 401 when no token is provided', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/v1/packages/${fakeId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/packages/:id/status', () => {
    it('should update package status successfully (ADMIN)', async () => {
      const pkg = Package.create({
        userId: regularUser.id,
        origin: 'Origin',
        destination: 'Destination',
        weight: 5.5,
        dimensions: { length: 1.5, width: 1.0, height: 0.5 },
        status: PackageStatus.PENDING,
      });
      await packageRepository.save({
        id: pkg.id,
        trackingNumber: pkg.trackingNumber,
        userId: pkg.userId,
        origin: pkg.origin,
        destination: pkg.destination,
        status: pkg.status,
        weight: pkg.weight,
        dimensions: pkg.dimensions,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
      });

      const updateDto = {
        status: PackageStatus.IN_TRANSIT,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/packages/${pkg.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.data.status).toBe(PackageStatus.IN_TRANSIT);
    });

    it('should return 403 when USER tries to update status', async () => {
      const pkg = Package.create({
        userId: regularUser.id,
        origin: 'Origin',
        destination: 'Destination',
        weight: 5.5,
        dimensions: { length: 1.5, width: 1.0, height: 0.5 },
      });
      await packageRepository.save({
        id: pkg.id,
        trackingNumber: pkg.trackingNumber,
        userId: pkg.userId,
        origin: pkg.origin,
        destination: pkg.destination,
        status: pkg.status,
        weight: pkg.weight,
        dimensions: pkg.dimensions,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
      });

      const updateDto = {
        status: PackageStatus.IN_TRANSIT,
      };

      await request(app.getHttpServer())
        .patch(`/api/v1/packages/${pkg.id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateDto)
        .expect(403);
    });

    it('should return 400 when status transition is invalid', async () => {
      const pkg = Package.create({
        userId: regularUser.id,
        origin: 'Origin',
        destination: 'Destination',
        weight: 5.5,
        dimensions: { length: 1.5, width: 1.0, height: 0.5 },
        status: PackageStatus.DELIVERED, // Ya entregado
      });
      await packageRepository.save({
        id: pkg.id,
        trackingNumber: pkg.trackingNumber,
        userId: pkg.userId,
        origin: pkg.origin,
        destination: pkg.destination,
        status: pkg.status,
        weight: pkg.weight,
        dimensions: pkg.dimensions,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
      });

      const updateDto = {
        status: PackageStatus.PENDING, // No se puede volver a PENDING
      };

      await request(app.getHttpServer())
        .patch(`/api/v1/packages/${pkg.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(400);
    });

    it('should return 404 when package not found', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateDto = {
        status: PackageStatus.IN_TRANSIT,
      };

      await request(app.getHttpServer())
        .patch(`/api/v1/packages/${fakeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(404);
    });

    it('should return 401 when no token is provided', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateDto = {
        status: PackageStatus.IN_TRANSIT,
      };

      await request(app.getHttpServer())
        .patch(`/api/v1/packages/${fakeId}/status`)
        .send(updateDto)
        .expect(401);
    });
  });
});

