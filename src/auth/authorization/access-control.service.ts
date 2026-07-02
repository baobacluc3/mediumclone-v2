import { Injectable } from "@nestjs/common";

import { Permission, ROLE_LEVEL, ROLE_PERMISSIONS } from "../permissions";
import { AuthUser, UserRole } from "../types/auth-user.type";

@Injectable()
export class AccessControlService {
  normalizeRoles(roles?: UserRole[]): UserRole[] {
    const normalized = roles?.length ? roles : [UserRole.USER];
    return [...new Set(normalized)].filter((role) => role in ROLE_LEVEL);
  }

  //Does the user have at least one of the required roles?
  hasAnyRole(
    userRoles: UserRole[] = [],
    requiredRoles: UserRole[] = [],
  ): boolean {
    if (!requiredRoles.length) {
      return true;
    }

    const normalizedRoles = this.normalizeRoles(userRoles);

    return requiredRoles.some((requiredRole) =>
      normalizedRoles.some(
        (userRole) => ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole],
      ),
    );
  }

  //Does the user have ALL of the required permissions?
  hasEveryPermission(
    userRoles: UserRole[] = [],
    requiredPermissions: Permission[] = [],
  ): boolean {
    if (!requiredPermissions.length) {
      return true;
    }

    const userPermissions = this.getPermissionsForRoles(userRoles);

    return requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );
  }

  //Owner-or-permission policy: the user may act on the resource if they own
  //it, or if their roles grant the override permission (e.g. admin actions).
  isOwnerOrHasPermission(
    user: AuthUser,
    resourceOwnerId: number,
    overridePermission: Permission,
  ): boolean {
    return (
      user.id === resourceOwnerId ||
      this.hasEveryPermission(user.roles, [overridePermission])
    );
  }

  getPermissionsForRoles(userRoles: UserRole[] = []): Set<Permission> {
    const permissions = new Set<Permission>();

    for (const role of this.normalizeRoles(userRoles)) {
      for (const permission of ROLE_PERMISSIONS[role] ?? []) {
        permissions.add(permission);
      }
    }

    return permissions;
  }
}
