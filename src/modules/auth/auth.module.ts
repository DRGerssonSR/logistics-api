import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { TokenGeneratorService } from '../../infrastructure/services/token-generator.service';
import { AuthController } from '../../infrastructure/controllers/auth.controller';
import { JwtStrategy } from '../../infrastructure/strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'your-secret-key-change-in-production',
        ),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    JwtStrategy,
    {
      provide: 'TokenGeneratorPort',
      useClass: TokenGeneratorService,
    },
  ],
  exports: [LoginUseCase],
})
export class AuthModule {}

