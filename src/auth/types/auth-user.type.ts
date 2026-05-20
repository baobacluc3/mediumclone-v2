export type UserRole = "user" | "moderator" | "admin";

export interface AuthUser {
  id: number;
  email?: string;
  roles: UserRole[];
}
