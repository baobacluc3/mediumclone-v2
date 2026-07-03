import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginUserDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { RateLimit } from "@/common/decorators/rate-limit.decorator";
import { RateLimitGuard } from "@/common/guards/rate-limit.guard";
import { User } from "@/common/decorators/user.decorator";
import { Public } from "@/authorization/decorators/public.decorator";
import { AuthenticatedUser } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 5, ttlMs: 60_000 })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 10, ttlMs: 60_000 })
  login(@Body() loginDto: LoginUserDto) {
    return this.authService.login(loginDto);
  }

  @Post("refresh")
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 20, ttlMs: 60_000 })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post("verify-email")
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 10, ttlMs: 60_000 })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post("resend-verification")
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 3, ttlMs: 60_000 })
  resendVerification(@Body() dto: ForgotPasswordDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post("forgot-password")
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 3, ttlMs: 60_000 })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post("reset-password")
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 5, ttlMs: 60_000 })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post("logout")
  logout(@User() user: AuthenticatedUser) {
    return this.authService.logout(user);
  }

  @Get("profile")
  profile(@User() user: AuthenticatedUser) {
    return {
      userId: user.id,
      email: user.email,
      roles: user.roles,
    };
  }
}
