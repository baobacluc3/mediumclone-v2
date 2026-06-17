import { UserRole } from "./types/auth-user.type";

export enum Permission {
  CREATE_ARTICLE = "article:create",
  UPDATE_ANY_ARTICLE = "article:update:any",
  DELETE_ANY_ARTICLE = "article:delete:any",
  DELETE_ANY_COMMENT = "comment:delete:any",
  DELETE_ANY_USER = "user:delete:any",
  MANAGE_USER_ROLES = "user:roles:manage",
  MANAGE_TAGS = "tag:manage",
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [Permission.CREATE_ARTICLE],
  [UserRole.MODERATOR]: [
    Permission.CREATE_ARTICLE,
    Permission.DELETE_ANY_COMMENT,
    Permission.MANAGE_TAGS,
  ],
  [UserRole.ADMIN]: [
    Permission.CREATE_ARTICLE,
    Permission.UPDATE_ANY_ARTICLE,
    Permission.DELETE_ANY_ARTICLE,
    Permission.DELETE_ANY_COMMENT,
    Permission.DELETE_ANY_USER,
    Permission.MANAGE_USER_ROLES,
    Permission.MANAGE_TAGS,
  ],
};
