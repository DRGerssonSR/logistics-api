import { Global, Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PasswordHasherService } from './infrastructure/services/password-hasher.service';
import { TokenGeneratorService } from './infrastructure/services/token-generator.service';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '1d') as any,
        },
      }),
    }),
  ],
  providers: [
    PasswordHasherService,
    TokenGeneratorService,
    {
      provide: 'PasswordHasherPort',
      useClass: PasswordHasherService,
    },
    {
      provide: 'TokenGeneratorPort',
      useClass: TokenGeneratorService,
    },
    {
      provide: 'PasswordHasherService',
      useClass: PasswordHasherService,
    },
  ],
  exports: [
    PasswordHasherService,
    TokenGeneratorService,
    'PasswordHasherPort',
    'TokenGeneratorPort',
    'PasswordHasherService',
    JwtModule,
    PassportModule,
  ],
})
export class SharedModule {}

