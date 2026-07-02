import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  ForbiddenException,
} from "@nestjs/common";
import { ParsePositiveIntPipe } from "../common/pipes/parse-positive-int.pipe";
import { UpdateUserDto, UpdateUserRolesDto } from "./dto";
import { UserRO } from "./user.interface";
import { UserService } from "./user.service";
import { User } from "../common/decorators/user.decorator";
import { RequiredBodyPipe } from "@/common/pipes/required-body.pipe";
import { RequirePermissions } from "@/common/decorators/permissions.decorator";
import { Permission } from "@/auth/permissions";
import { AuthenticatedUser } from "@/auth/auth.types";
import { AccessControlService } from "@/auth/authorization/access-control.service";

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly accessControl: AccessControlService,
  ) {}

  @Get("user")
  async findMe(@User("id") userId: number): Promise<UserRO> {
    return this.userService.findById(userId);
  }

  @Put("user")
  async update(
    @User("id") userId: number,
    @Body("user", new RequiredBodyPipe("user")) dto: UpdateUserDto,
  ): Promise<UserRO> {
    return this.userService.update(userId, dto);
  }

  @Delete("users/:id")
  async delete(
    @User() currentUser: AuthenticatedUser,
    @Param("id", ParsePositiveIntPipe) id: number,
  ): Promise<void> {
    const canDelete = this.accessControl.isOwnerOrHasPermission(
      currentUser,
      id,
      Permission.DELETE_ANY_USER,
    );

    if (!canDelete) {
      throw new ForbiddenException("You can only delete your own account.");
    }

    await this.userService.delete(id);
  }

  @Patch("users/:id/roles")
  @RequirePermissions(Permission.MANAGE_USER_ROLES)
  updateRoles(
    @Param("id", ParsePositiveIntPipe) id: number,
    @Body() dto: UpdateUserRolesDto,
  ): Promise<UserRO> {
    return this.userService.updateRoles(id, dto.roles);
  }
}
