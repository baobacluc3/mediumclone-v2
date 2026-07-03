import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Put,
} from "@nestjs/common";
import { subject } from "@casl/ability";

import { ParsePositiveIntPipe } from "../common/pipes/parse-positive-int.pipe";
import { UpdateUserDto, UpdateUserRolesDto } from "./dto";
import { UserRO } from "./user.interface";
import { UserService } from "./user.service";
import { User } from "../common/decorators/user.decorator";
import { RequiredBodyPipe } from "@/common/pipes/required-body.pipe";
import { AuthenticatedUser } from "@/auth/auth.types";
import { CaslAbilityFactory } from "@/authorization/abilities/casl-ability.factory";
import { RequirePermissions } from "@/authorization/decorators/require-permissions.decorator";
import { Action } from "@/authorization/domain/action.enum";
import { AppSubject } from "@/authorization/domain/app-subject.enum";

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly abilityFactory: CaslAbilityFactory,
  ) {}

  @Get("user")
  async findMe(@User("id") userId: number): Promise<UserRO> {
    return this.userService.findById(userId);
  }

  @Get("user/permissions")
  async myPermissions(@User() currentUser: AuthenticatedUser) {
    const ability = await this.abilityFactory.createForUser(currentUser);

    return {
      roles: currentUser.roles,
      abilities: ability.rules.map((rule) => ({
        action: rule.action,
        subject: rule.subject,
        ...(rule.conditions ? { conditions: rule.conditions } : {}),
        ...(rule.inverted ? { inverted: true } : {}),
      })),
    };
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
    const ability = await this.abilityFactory.createForUser(currentUser);

    // Tagging a minimal subject lets the ownership condition (own account) and
    // the "delete any user" permission both be evaluated without a DB lookup,
    // and without leaking whether the target id exists.
    if (ability.cannot(Action.Delete, subject(AppSubject.User, { id }))) {
      throw new ForbiddenException("You can only delete your own account.");
    }

    await this.userService.delete(id);
  }

  @Patch("users/:id/roles")
  @RequirePermissions({ action: Action.Manage, subject: AppSubject.Role })
  updateRoles(
    @User("id") actorId: number,
    @Param("id", ParsePositiveIntPipe) id: number,
    @Body() dto: UpdateUserRolesDto,
  ): Promise<UserRO> {
    return this.userService.updateRoles(id, dto.roles, actorId);
  }
}
