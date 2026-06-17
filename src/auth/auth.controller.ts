import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginUserDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { User } from "@/common/decorators/user.decorator";
import { AuthenticatedUser } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() loginDto: LoginUserDto) {
    return this.authService.login(loginDto);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  logout(@User() user: AuthenticatedUser) {
    return this.authService.logout(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  profile(@User() user: AuthenticatedUser) {
    return {
      userId: user.id,
      email: user.email,
      roles: user.roles,
    };
  }
}
