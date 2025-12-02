import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { SignupPendingDto } from './dto/signup-pending.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LogoutDto } from './dto/logout.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() body: LoginDto) {
    const { email, password } = body;
    return this.auth.login(email, password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async logout(@Body() body: LogoutDto, @Req() req: any) {
    const userId = req.user?.userId;
    return this.auth.logout(body.refreshToken, userId);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  async register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  @Post('signup-pending')
  @HttpCode(HttpStatus.ACCEPTED)
  @Public()
  async signupPending(@Body() body: SignupPendingDto) {
    return this.auth.signupPending(body);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @Public()
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.auth.forgotPassword(body.email);
  }
}
