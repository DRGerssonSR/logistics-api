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

describe('TrackingController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<UserEntity>;
  let packageRepository: Repository<PackageEntity>;
  let jwtService: JwtService;
  let passwordHasher: PasswordHasherPort;
  let adminToken: string;
  let userToken: string;
  let adminUser: User;
  let regularUser: User;
  let testPackage: Package;

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
      email: 'admin@tracking.com',
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
      email: 'user@tracking.com',
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

    // Crear paquete de prueba
    testPackage = Package.create({
      userId: regularUser.id,
      origin: 'Ciudad de México',
      destination: 'Guadalajara',
      weight: 5.5,
      dimensions: { length: 1.5, width: 1.0, height: 0.5 },
      status: PackageStatus.PENDING,
    });
    await packageRepository.save({
      id: testPackage.id,
      trackingNumber: testPackage.trackingNumber,
      userId: testPackage.userId,
      origin: testPackage.origin,
      destination: testPackage.destination,
      status: testPackage.status,
      weight: testPackage.weight,
      dimensions: testPackage.dimensions,
      createdAt: testPackage.createdAt,
      updatedAt: testPackage.updatedAt,
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
    // Limpiar datos entre tests (excepto usuarios y paquete base)
    const allPackages = await packageRepository.find();
    for (const pkg of allPackages) {
      if (pkg.id !== testPackage.id) {
        await packageRepository.remove(pkg);
      }
    }
    const allUsers = await userRepository.find();
    for (const user of allUsers) {
      if (user.email !== 'admin@tracking.com' && user.email !== 'user@tracking.com') {
        await userRepository.remove(user);
      }
    }
  });

  describe('POST /api/v1/packages/:packageId/tracking', () => {
    it('should create tracking event successfully for package owner', async () => {
      const createTrackingDto = {
        location: 'Centro de distribución CDMX',
        status: PackageStatus.IN_TRANSIT,
        notes: 'Paquete en tránsito hacia destino final',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/packages/${testPackage.id}/tracking`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createTrackingDto)
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.location).toBe(createTrackingDto.location);
      expect(response.body.data.status).toBe(createTrackingDto.status);
      expect(response.body.data.notes).toBe(createTrackingDto.notes);
      expect(response.body.data.packageId).toBe(testPackage.id);
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('should create tracking event successfully for ADMIN', async () => {
      const createTrackingDto = {
        location: 'Centro de distribución GDL',
        status: PackageStatus.DELIVERED,
        notes: 'Paquete entregado exitosamente',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/packages/${testPackage.id}/tracking`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createTrackingDto)
        .expect(201);

      expect(response.body.data.status).toBe(PackageStatus.DELIVERED);
    });

    it('should return 403 when USER tries to create tracking for another user package', async () => {
      // Crear paquete de otro usuario
      const otherPackage = Package.create({
        userId: adminUser.id,
        origin: 'Origin',
        destination: 'Destination',
        weight: 5.5,
        dimensions: { length: 1.5, width: 1.0, height: 0.5 },
      });
      await packageRepository.save({
        id: otherPackage.id,
        trackingNumber: otherPackage.trackingNumber,
        userId: otherPackage.userId,
        origin: otherPackage.origin,
        destination: otherPackage.destination,
        status: otherPackage.status,
        weight: otherPackage.weight,
        dimensions: otherPackage.dimensions,
        createdAt: otherPackage.createdAt,
        updatedAt: otherPackage.updatedAt,
      });

      const createTrackingDto = {
        location: 'Location',
        status: PackageStatus.IN_TRANSIT,
      };

      await request(app.getHttpServer())
        .post(`/api/v1/packages/${otherPackage.id}/tracking`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createTrackingDto)
        .expect(403);
    });

    it('should return 404 when package does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const createTrackingDto = {
        location: 'Location',
        status: PackageStatus.IN_TRANSIT,
      };

      await request(app.getHttpServer())
        .post(`/api/v1/packages/${fakeId}/tracking`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createTrackingDto)
        .expect(404);
    });

    it('should return 401 when no token is provided', async () => {
      const createTrackingDto = {
        location: 'Location',
        status: PackageStatus.IN_TRANSIT,
      };

      await request(app.getHttpServer())
        .post(`/api/v1/packages/${testPackage.id}/tracking`)
        .send(createTrackingDto)
        .expect(401);
    });

    it('should return 400 when DTO validation fails (missing location)', async () => {
      const createTrackingDto = {
        status: PackageStatus.IN_TRANSIT,
      };

      await request(app.getHttpServer())
        .post(`/api/v1/packages/${testPackage.id}/tracking`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createTrackingDto)
        .expect(400);
    });

    it('should return 400 when status is invalid', async () => {
      const createTrackingDto = {
        location: 'Location',
        status: 'INVALID_STATUS' as any,
      };

      await request(app.getHttpServer())
        .post(`/api/v1/packages/${testPackage.id}/tracking`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createTrackingDto)
        .expect(400);
    });

    it('should create tracking event without notes (optional field)', async () => {
      const createTrackingDto = {
        location: 'Centro de distribución CDMX',
        status: PackageStatus.IN_TRANSIT,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/packages/${testPackage.id}/tracking`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createTrackingDto)
        .expect(201);

      expect(response.body.data.location).toBe(createTrackingDto.location);
      expect(response.body.data.status).toBe(createTrackingDto.status);
    });
  });

  describe('GET /api/v1/packages/:packageId/tracking', () => {
    it('should return tracking history for package owner', async () => {
      // Crear algunos eventos de tracking primero
      const trackingEvents = [
        {
          location: 'Centro de distribución CDMX',
          status: PackageStatus.PENDING,
          notes: 'Paquete recibido',
        },
        {
          location: 'En tránsito',
          status: PackageStatus.IN_TRANSIT,
          notes: 'En camino',
        },
      ];

      for (const event of trackingEvents) {
        await request(app.getHttpServer())
          .post(`/api/v1/packages/${testPackage.id}/tracking`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(event)
          .expect(201);
      }

      const response = await request(app.getHttpServer())
        .get(`/api/v1/packages/${testPackage.id}/tracking`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('packageId');
      expect(response.body.data).toHaveProperty('events');
      expect(Array.isArray(response.body.data.events)).toBe(true);
      expect(response.body.data.events.length).toBeGreaterThanOrEqual(2);
      
      // Verificar que los eventos están ordenados por fecha (más reciente primero)
      const events = response.body.data.events;
      for (let i = 0; i < events.length - 1; i++) {
        const currentDate = new Date(events[i].createdAt);
        const nextDate = new Date(events[i + 1].createdAt);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });

    it('should return tracking history for ADMIN (any package)', async () => {
      // Crear evento de tracking
      await request(app.getHttpServer())
        .post(`/api/v1/packages/${testPackage.id}/tracking`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          location: 'Location',
          status: PackageStatus.IN_TRANSIT,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/packages/${testPackage.id}/tracking`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.packageId).toBe(testPackage.id);
      expect(response.body.data.events.length).toBeGreaterThan(0);
    });

    it('should return 403 when USER tries to access another user package tracking', async () => {
      // Crear paquete de otro usuario
      const otherPackage = Package.create({
        userId: adminUser.id,
        origin: 'Origin',
        destination: 'Destination',
        weight: 5.5,
        dimensions: { length: 1.5, width: 1.0, height: 0.5 },
      });
      await packageRepository.save({
        id: otherPackage.id,
        trackingNumber: otherPackage.trackingNumber,
        userId: otherPackage.userId,
        origin: otherPackage.origin,
        destination: otherPackage.destination,
        status: otherPackage.status,
        weight: otherPackage.weight,
        dimensions: otherPackage.dimensions,
        createdAt: otherPackage.createdAt,
        updatedAt: otherPackage.updatedAt,
      });

      await request(app.getHttpServer())
        .get(`/api/v1/packages/${otherPackage.id}/tracking`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 404 when package does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/v1/packages/${fakeId}/tracking`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/packages/${testPackage.id}/tracking`)
        .expect(401);
    });

    it('should return 404 when no tracking events exist', async () => {
      // Crear un nuevo paquete sin eventos
      const newPackage = Package.create({
        userId: regularUser.id,
        origin: 'Origin',
        destination: 'Destination',
        weight: 5.5,
        dimensions: { length: 1.5, width: 1.0, height: 0.5 },
      });
      await packageRepository.save({
        id: newPackage.id,
        trackingNumber: newPackage.trackingNumber,
        userId: newPackage.userId,
        origin: newPackage.origin,
        destination: newPackage.destination,
        status: newPackage.status,
        weight: newPackage.weight,
        dimensions: newPackage.dimensions,
        createdAt: newPackage.createdAt,
        updatedAt: newPackage.updatedAt,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/packages/${newPackage.id}/tracking`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.message).toContain('No tracking events found');
    });
  });
});

