import { Injectable, Inject, Logger } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import type { UserRepositoryPort } from '../../domain/ports/output/user.repository.port';

@Injectable()
export class UsersSeed {
  private readonly logger = new Logger(UsersSeed.name);

  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async seed(): Promise<void> {
    try {
      // Verificar si ya existen usuarios
      const existingUsers = await this.userRepository.findMany({
        page: 1,
        limit: 1,
      });

      if (existingUsers.total > 0) {
        this.logger.log('Users already exist, skipping seed');
        return;
      }

      // Obtener credenciales de variables de entorno o usar valores por defecto
      const adminEmail =
        process.env.ADMIN_EMAIL || 'admin@logistics.com';
      const adminPassword =
        process.env.ADMIN_PASSWORD || 'admin123';
      const adminName =
        process.env.ADMIN_NAME || 'Administrator';

      // Crear usuario admin por defecto
      const adminUser = User.create({
        email: adminEmail,
        password: adminPassword,
        name: adminName,
        role: UserRole.ADMIN,
      });

      await this.userRepository.create(adminUser);

      this.logger.log(
        `Default admin user created: ${adminEmail}`,
      );
      this.logger.warn(
        `Default password: ${adminPassword} - Please change it in production!`,
      );
    } catch (error) {
      this.logger.error('Error seeding users', error);
      throw error;
    }
  }
}

