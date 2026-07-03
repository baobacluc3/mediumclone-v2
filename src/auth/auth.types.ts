export interface JwtUserPayload {
  id?: number;
  sub?: number;
  username?: string;
  email: string;
  roles?: string[];
  tokenType?: "access" | "refresh";
}

export interface AuthenticatedUser extends JwtUserPayload {
  id: number;
  username: string;
  bio: string;
  image: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
