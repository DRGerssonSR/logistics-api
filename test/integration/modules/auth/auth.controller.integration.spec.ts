import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupTestApp } from '../../../setup/integration.setup';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/modules/users/infrastructure/persistence/user.entity.sql';
import { UserRole } from 'src/modules/users/domain/value-objects/user-role.vo';
import { UserStatus } from 'src/modules/users/domain/value-objects/user-status.vo';
import { User } from 'src/modules/users/domain/entities/user.entity';
import type { PasswordHasherPort } from 'src/shared/domain/ports/password-hasher.port';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<UserEntity>;
  let passwordHasher: PasswordHasherPort;
  let testUser: User;

  beforeAll(async () => {
    const { app: testApp, moduleFixture } = await createTestApp();
    app = testApp;
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
    passwordHasher = moduleFixture.get('PasswordHasherPort');

    // Crear usuario de prueba para login
    const userPassword = await passwordHasher.hash('password123');
    testUser = User.create({
      email: 'testuser@example.com',
      password: userPassword,
      name: 'Test User',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save({
      id: testUser.id,
      email: testUser.email,
      password: testUser.password,
      name: testUser.name,
      role: testUser.role,
      status: testUser.status,
      createdAt: testUser.createdAt,
      updatedAt: testUser.updatedAt,
    });
  });

  afterAll(async () => {
    await cleanupTestApp();
  });

  beforeEach(async () => {
    // Limpiar datos entre tests (excepto el usuario base)
    const allUsers = await userRepository.find();
    for (const user of allUsers) {
      if (user.email !== 'testuser@example.com') {
        await userRepository.remove(user);
      }
    }
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: 'testuser@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(loginDto.email);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(typeof response.body.data.accessToken).toBe('string');
      expect(response.body.data.accessToken.length).toBeGreaterThan(0);
    });

    it('should return 401 when password is incorrect', async () => {
      const loginDto = {
        email: 'testuser@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should return 404 when user does not exist', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 400 when email is invalid', async () => {
      const loginDto = {
        email: 'invalid-email',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(400);
    });

    it('should return 400 when password is too short', async () => {
      const loginDto = {
        email: 'testuser@example.com',
        password: '12345', // Menos de 6 caracteres
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(400);
    });

    it('should return 400 when email is missing', async () => {
      const loginDto = {
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(400);
    });

    it('should return 400 when password is missing', async () => {
      const loginDto = {
        email: 'testuser@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(400);
    });

    it('should return user data without password in response', async () => {
      const loginDto = {
        email: 'testuser@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('email');
      expect(response.body.data.user).toHaveProperty('name');
      expect(response.body.data.user).toHaveProperty('role');
      expect(response.body.data.user).toHaveProperty('status');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should login successfully with ADMIN user', async () => {
      // Crear usuario admin
      const adminPassword = await passwordHasher.hash('admin123');
      const adminUser = User.create({
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

      const loginDto = {
        email: 'admin@test.com',
        password: 'admin123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body.data.user.role).toBe(UserRole.ADMIN);
      expect(response.body.data.accessToken).toBeDefined();
    });
  });
});

