import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { ParsePositiveIntPipe } from "../common/pipes/parse-positive-int.pipe";
import { UpdateUserDto, UpdateUserRolesDto } from "./dto";
import { UserRO } from "./user.interface";
import { UserService } from "./user.service";
import { User } from "../common/decorators/user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AccessControlGuard } from "@/auth/authorization/access-control.guard";
import { RequirePermissions } from "@/common/decorators/permissions.decorator";
import { Permission } from "@/auth/permissions";
import { AuthenticatedUser } from "@/auth/auth.types";
import { UserRole } from "@/auth/types/auth-user.type";

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("user")
  @UseGuards(JwtAuthGuard)
  async findMe(@User("id") userId: number): Promise<UserRO> {
    return this.userService.findById(userId);
  }

  @Put("user")
  @UseGuards(JwtAuthGuard)
  async update(
    @User("id") userId: number,
    @Body("user") dto: UpdateUserDto,
  ): Promise<UserRO> {
    return this.userService.update(userId, dto);
  }

  @Delete("users/:id")
  @UseGuards(JwtAuthGuard)
  async delete(
    @User() currentUser: AuthenticatedUser,
    @Param("id", ParsePositiveIntPipe) id: number,
  ): Promise<void> {
    const canDeleteAny = currentUser.roles?.includes(UserRole.ADMIN);

    if (currentUser.id !== id && !canDeleteAny) {
      throw new ForbiddenException("You can only delete your own account.");
    }

    await this.userService.delete(id);
  }

  @Patch("users/:id/roles")
  @UseGuards(JwtAuthGuard, AccessControlGuard)
  @RequirePermissions(Permission.MANAGE_USER_ROLES)
  updateRoles(
    @Param("id", ParsePositiveIntPipe) id: number,
    @Body() dto: UpdateUserRolesDto,
  ): Promise<UserRO> {
    return this.userService.updateRoles(id, dto.roles);
  }
}
