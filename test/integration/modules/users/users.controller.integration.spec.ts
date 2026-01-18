import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupTestApp } from '../../../setup/integration.setup';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/modules/users/infrastructure/persistence/user.entity.sql';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/modules/users/domain/value-objects/user-role.vo';
import { UserStatus } from 'src/modules/users/domain/value-objects/user-status.vo';
import { User } from 'src/modules/users/domain/entities/user.entity';
import type { PasswordHasherPort } from 'src/shared/domain/ports/password-hasher.port';

describe('UsersController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<UserEntity>;
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
    jwtService = moduleFixture.get(JwtService);
    passwordHasher = moduleFixture.get('PasswordHasherPort');

    // Crear usuario admin para los tests
    const adminPassword = await passwordHasher.hash('admin123');
    adminUser = User.create({
      email: 'admin@test.com',
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
      email: 'user@test.com',
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
    const allUsers = await userRepository.find();
    for (const user of allUsers) {
      if (user.email !== 'admin@test.com' && user.email !== 'user@test.com') {
        await userRepository.remove(user);
      }
    }
  });

  describe('POST /api/v1/users', () => {
    it('should create a user successfully (ADMIN)', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: 'USER',
        status: 'ACTIVE',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createUserDto)
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(createUserDto.email);
      expect(response.body.data.name).toBe(createUserDto.name);
      expect(response.body.data.role).toBe(createUserDto.role);
      expect(response.body.data.status).toBe(createUserDto.status);
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should return 403 when USER tries to create user', async () => {
      const createUserDto = {
        email: 'unauthorized@example.com',
        password: 'password123',
        name: 'Unauthorized User',
        role: 'USER',
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createUserDto)
        .expect(403);
    });

    it('should return 401 when no token is provided', async () => {
      const createUserDto = {
        email: 'notoken@example.com',
        password: 'password123',
        name: 'No Token User',
        role: 'USER',
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send(createUserDto)
        .expect(401);
    });

    it('should return 409 when email already exists', async () => {
      const createUserDto = {
        email: 'admin@test.com', // Email ya existente
        password: 'password123',
        name: 'Duplicate User',
        role: 'USER',
        status: 'ACTIVE',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createUserDto)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 when role is invalid', async () => {
      const createUserDto = {
        email: 'invalidrole@example.com',
        password: 'password123',
        name: 'Invalid Role User',
        role: 'INVALID_ROLE',
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createUserDto)
        .expect(400);
    });

    it('should return 400 when status is invalid', async () => {
      const createUserDto = {
        email: 'invalidstatus@example.com',
        password: 'password123',
        name: 'Invalid Status User',
        role: 'USER',
        status: 'INVALID_STATUS',
      };

      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createUserDto)
        .expect(400);
    });

    it('should return 400 when DTO validation fails (missing email)', async () => {
      const createUserDto = {
        password: 'password123',
        name: 'Missing Email User',
        role: 'USER',
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createUserDto)
        .expect(400);
    });

    it('should return 400 when password is too short', async () => {
      const createUserDto = {
        email: 'shortpass@example.com',
        password: '12345', // Menos de 6 caracteres
        name: 'Short Password User',
        role: 'USER',
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createUserDto)
        .expect(400);
    });

    it('should create user with ADMIN role successfully', async () => {
      const createUserDto = {
        email: 'newadmin@example.com',
        password: 'password123',
        name: 'New Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createUserDto)
        .expect(201);

      expect(response.body.data.role).toBe('ADMIN');
    });

    it('should create user with default ACTIVE status when status is not provided', async () => {
      const createUserDto = {
        email: 'defaultstatus@example.com',
        password: 'password123',
        name: 'Default Status User',
        role: 'USER',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createUserDto)
        .expect(201);

      expect(response.body.data.status).toBe('ACTIVE');
    });
  });

  describe('GET /api/v1/users', () => {
    it('should return paginated list of users', async () => {
      // Crear algunos usuarios adicionales
      for (let i = 0; i < 5; i++) {
        const password = await passwordHasher.hash('password123');
        const user = User.create({
          email: `user${i}@example.com`,
          password,
          name: `User ${i}`,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
        });
        await userRepository.save({
          id: user.id,
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });

    it('should return paginated list with default pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(401);
    });

    it('should allow USER role to list users', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(adminUser.id);
      expect(response.body.data.email).toBe(adminUser.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 404 when user not found', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      await request(app.getHttpServer())
        .get(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/users/${adminUser.id}`)
        .expect(401);
    });

    it('should allow USER role to get user by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(regularUser.id);
    });
  });
});

