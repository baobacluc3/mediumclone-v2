import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import {
  REQUIRED_PERMISSIONS_KEY,
  REQUIRED_ROLES_KEY,
} from "./authorization.constants";
import { Permission } from "../permissions";
import { AuthUser, UserRole } from "../types/auth-user.type";
import { AccessControlService } from "./access-control.service";

@Injectable()
export class AccessControlGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessControl: AccessControlService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length && !requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("Authentication is required.");
    }

    const hasRequiredRole = this.accessControl.hasAnyRole(
      user.roles,
      requiredRoles,
    );
    const hasRequiredPermissions = this.accessControl.hasEveryPermission(
      user.roles,
      requiredPermissions,
    );

    if (!hasRequiredRole || !hasRequiredPermissions) {
      throw new ForbiddenException("You do not have permission for this action.");
    }

    return true;
  }
}
