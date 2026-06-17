export enum UserRole {
  USER = "user",
  MODERATOR = "moderator",
  ADMIN = "admin",
}

export interface AuthUser {
  id: number;
  email?: string;
  roles: UserRole[];
}
