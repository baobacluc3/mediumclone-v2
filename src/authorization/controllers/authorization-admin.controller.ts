import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
} from "@nestjs/common";

import { User } from "@/common/decorators/user.decorator";
import { ParsePositiveIntPipe } from "@/common/pipes/parse-positive-int.pipe";
import { Action } from "../domain/action.enum";
import { AppSubject } from "../domain/app-subject.enum";
import { RequirePermissions } from "../decorators/require-permissions.decorator";
import { CreateRoleDto, SetRolePermissionsDto, UpdateRoleDto } from "../dto";
import { toPermissionView, toRoleView } from "../presenters/role.view";
import { PermissionsService } from "../services/permissions.service";
import { RolesService } from "../services/roles.service";

/**
 * Runtime administration of the RBAC catalog. Reads require the `read:Role`
 * permission; mutations require `manage:Role`. Both are enforced by the global
 * PoliciesGuard via the decorators below.
 */
@Controller("admin")
export class AuthorizationAdminController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get("permissions")
  @RequirePermissions({ action: Action.Read, subject: AppSubject.Role })
  async listPermissions() {
    const permissions = await this.permissionsService.list();
    return { permissions: permissions.map(toPermissionView) };
  }

  @Get("roles")
  @RequirePermissions({ action: Action.Read, subject: AppSubject.Role })
  async listRoles() {
    const roles = await this.rolesService.list();
    return { roles: roles.map(toRoleView) };
  }

  @Get("roles/:id")
  @RequirePermissions({ action: Action.Read, subject: AppSubject.Role })
  async getRole(@Param("id", ParsePositiveIntPipe) id: number) {
    return { role: toRoleView(await this.rolesService.findById(id)) };
  }

  @Post("roles")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions({ action: Action.Manage, subject: AppSubject.Role })
  async createRole(@User("id") actorId: number, @Body() dto: CreateRoleDto) {
    return { role: toRoleView(await this.rolesService.create(dto, actorId)) };
  }

  @Patch("roles/:id")
  @RequirePermissions({ action: Action.Manage, subject: AppSubject.Role })
  async updateRole(
    @User("id") actorId: number,
    @Param("id", ParsePositiveIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return {
      role: toRoleView(await this.rolesService.update(id, dto, actorId)),
    };
  }

  @Put("roles/:id/permissions")
  @RequirePermissions({ action: Action.Manage, subject: AppSubject.Role })
  async setRolePermissions(
    @User("id") actorId: number,
    @Param("id", ParsePositiveIntPipe) id: number,
    @Body() dto: SetRolePermissionsDto,
  ) {
    return {
      role: toRoleView(
        await this.rolesService.setPermissions(id, dto.permissions, actorId),
      ),
    };
  }

  @Delete("roles/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions({ action: Action.Manage, subject: AppSubject.Role })
  async deleteRole(
    @User("id") actorId: number,
    @Param("id", ParsePositiveIntPipe) id: number,
  ): Promise<void> {
    await this.rolesService.remove(id, actorId);
  }
}
