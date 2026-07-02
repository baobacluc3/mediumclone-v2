import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginUserDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { Public } from "@/common/decorators/public.decorator";
import { RateLimit } from "@/common/decorators/rate-limit.decorator";
import { RateLimitGuard } from "@/common/guards/rate-limit.guard";
import { User } from "@/common/decorators/user.decorator";
import { AuthenticatedUser } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("register")
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 5, ttlMs: 60_000 })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("login")
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 10, ttlMs: 60_000 })
  login(@Body() loginDto: LoginUserDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post("refresh")
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 20, ttlMs: 60_000 })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
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
