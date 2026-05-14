import { Controller, Get, UseGuards } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Role } from "../common/role.enum";
import { User } from "../user/user.decorator";
import { JwtAuthGuard } from "../user/jwt-auth.guard";

interface DemoResponse {
  // A small message makes it easy for beginners to test each RBAC route.
  message: string;
}

@Controller("rbac")
export class RbacController {
  @Get("public")
  publicRoute(): DemoResponse {
    // Public routes do not need JWT authentication or role authorization.
    return { message: "Anyone can read this public route." };
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  loggedInRoute(@User("email") email: string): DemoResponse {
    // JwtAuthGuard validates the token and makes the current user available here.
    return { message: `You are logged in as ${email}.` };
  }

  @Get("admin")
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  adminOnlyRoute(): DemoResponse {
    // JwtAuthGuard authenticates first, then RolesGuard checks for the admin role.
    return { message: "Only admins can read this route." };
  }

  @Get("moderator")
  @Roles(Role.MODERATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  moderatorOnlyRoute(): DemoResponse {
    // The same guard pattern can protect any role-specific feature.
    return { message: "Only moderators can read this route." };
  }
}
