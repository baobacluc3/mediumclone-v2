import { Injectable } from "@nestjs/common";

import { Permission, ROLE_PERMISSIONS } from "../permissions";
import { UserRole } from "../types/auth-user.type";

const ROLE_LEVEL: Record<UserRole, number> = {
  [UserRole.USER]: 1,
  [UserRole.MODERATOR]: 2,
  [UserRole.ADMIN]: 3,
};

@Injectable()
export class AccessControlService {
  normalizeRoles(roles?: UserRole[]): UserRole[] {
    const normalized = roles?.length ? roles : [UserRole.USER];
    return [...new Set(normalized)].filter((role) => role in ROLE_LEVEL);
  }

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
