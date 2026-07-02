import { UserRole } from "./types/auth-user.type";

export enum Permission {
  CREATE_ARTICLE = "article:create",
  UPDATE_ANY_ARTICLE = "article:update:any",
  DELETE_ANY_ARTICLE = "article:delete:any",
  DELETE_ANY_USER = "user:delete:any",
  MANAGE_USER_ROLES = "user:roles:manage",
  MANAGE_TAGS = "tag:manage",
}

//Single source of truth for role seniority. A higher level inherits every
//permission granted to the levels below it.
export const ROLE_LEVEL: Record<UserRole, number> = {
  [UserRole.USER]: 1,
  [UserRole.MODERATOR]: 2,
  [UserRole.ADMIN]: 3,
};

//Permissions each role adds on top of what it inherits from lower roles.
const ROLE_ADDED_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [Permission.CREATE_ARTICLE],
  [UserRole.MODERATOR]: [Permission.MANAGE_TAGS],
  [UserRole.ADMIN]: [
    Permission.UPDATE_ANY_ARTICLE,
    Permission.DELETE_ANY_ARTICLE,
    Permission.DELETE_ANY_USER,
    Permission.MANAGE_USER_ROLES,
  ],
};

const buildEffectivePermissions = (role: UserRole): Permission[] => {
  const inherited = Object.values(UserRole)
    .filter((lowerRole) => ROLE_LEVEL[lowerRole] <= ROLE_LEVEL[role])
    .flatMap((lowerRole) => ROLE_ADDED_PERMISSIONS[lowerRole]);

  return [...new Set(inherited)];
};

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: buildEffectivePermissions(UserRole.USER),
  [UserRole.MODERATOR]: buildEffectivePermissions(UserRole.MODERATOR),
  [UserRole.ADMIN]: buildEffectivePermissions(UserRole.ADMIN),
};
