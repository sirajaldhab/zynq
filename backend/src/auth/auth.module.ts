import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

const jwtSecret = (() => {
  const value = process.env.JWT_SECRET;
  if (value && value.trim().length > 0) return value;
  if (process.env.NODE_ENV && process.env.NODE_ENV !== 'production') {
    // Dev fallback to keep DX smooth while still surfacing the requirement
    return 'dev-secret';
  }
  throw new Error('JWT_SECRET env variable must be set for authentication to work.');
})();

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: true,
      secret: jwtSecret,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
