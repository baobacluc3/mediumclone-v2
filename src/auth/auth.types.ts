import { UserRole } from "./types/auth-user.type";

export interface JwtUserPayload {
  id?: number;
  sub?: number;
  username?: string;
  email: string;
  roles?: UserRole[];
  tokenType?: "access" | "refresh";
}

export interface AuthenticatedUser extends JwtUserPayload {
  id: number;
  username: string;
  bio: string;
  image: string;
  roles: UserRole[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
