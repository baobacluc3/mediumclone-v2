import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { Role } from "../../common/role.enum";
import { AuthenticatedUser } from "../../user/auth.types";
import { ROLES_KEY } from "../decorators/roles.decorator";

interface RequestWithUser extends Request {
  // JwtStrategy attaches this user object to the request before RolesGuard runs.
  user?: AuthenticatedUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Read @Roles(...) metadata from the method first, then the controller class.
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If a route has no @Roles(...) decorator, this guard allows it by default.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Switch from Nest's generic execution context to the HTTP request object.
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // JwtAuthGuard should run before this guard, so a missing user means deny access.
    if (!user) {
      return false;
    }

    // Authorization decision: the authenticated user's role must match one required role.
    return requiredRoles.includes(user.role);
  }
}
