import { PermissionEntity } from "../entities/permission.entity";
import { RoleEntity } from "../entities/role.entity";

export interface PermissionView {
  action: string;
  subject: string;
  description: string;
  key: string;
}

export interface RoleView {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: PermissionView[];
  createdAt: Date;
  updatedAt: Date;
}

export const toPermissionView = (
  permission: PermissionEntity,
): PermissionView => ({
  action: permission.action,
  subject: permission.subject,
  description: permission.description,
  key: `${permission.action}:${permission.subject}`,
});

export const toRoleView = (role: RoleEntity): RoleView => ({
  id: role.id,
  name: role.name,
  description: role.description,
  isSystem: role.isSystem,
  permissions: (role.permissions ?? []).map(toPermissionView),
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
});
