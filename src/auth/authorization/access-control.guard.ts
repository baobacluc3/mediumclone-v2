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
    //Read metadata from the route
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    //Early exit for public routes
    if (!requiredRoles?.length && !requiredPermissions?.length) {
      return true;
    }

    //Get the logged-in user
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("Authentication is required.");
    }

    //Run both checks
    const hasRequiredRole = this.accessControl.hasAnyRole(
      user.roles,
      requiredRoles,
    );
    const hasRequiredPermissions = this.accessControl.hasEveryPermission(
      user.roles,
      requiredPermissions,
    );

    //Allow or Deny
    if (!hasRequiredRole || !hasRequiredPermissions) {
      throw new ForbiddenException(
        "You do not have permission for this action.",
      );
    }

    return true;
  }
}

/*

Incoming Request
      ↓
AccessControlGuard.canActivate()
      ↓
Read @RequireRoles / @RequirePermissions from route
      ↓
No decorators? ──────────────────────────→ ✅ Allow (public)
      ↓
No user on request? ─────────────────────→ ❌ 403 (not logged in)
      ↓
hasAnyRole() + hasEveryPermission()
      ↓
Both pass? ──────────────────────────────→ ✅ Allow
Either fails? ───────────────────────────→ ❌ 403 (not authorized)
      ↓
Controller runs

*/
