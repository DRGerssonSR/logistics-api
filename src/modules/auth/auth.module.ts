import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { TokenGeneratorService } from '../../infrastructure/services/token-generator.service';
import { AuthController } from '../../infrastructure/controllers/auth.controller';
import { JwtStrategy } from '../../infrastructure/strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
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

