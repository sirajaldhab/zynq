import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  async login(@Body() body: LoginDto) {
    const { email, password } = body;
    return this.auth.login(email, password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Public()
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.auth.refresh(refreshToken);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  async register(
    @Body()
    body: { name: string; email: string; password: string; roleName?: string },
  ) {
    const { name, email, password, roleName } = body;
    return this.auth.register({ name, email, password, roleName });
  }

  @Post('signup-pending')
  @HttpCode(HttpStatus.ACCEPTED)
  @Public()
  async signupPending(
    @Body()
    body: { name: string; email: string; password: string },
  ) {
    const { name, email, password } = body;
    return this.auth.signupPending({ name, email, password });
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @Public()
  async forgotPassword(@Body('email') email: string) {
    return this.auth.forgotPassword(email);
  }
}
