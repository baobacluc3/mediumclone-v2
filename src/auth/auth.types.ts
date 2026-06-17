export interface JwtUserPayload {
  id?: number;
  sub?: number;
  username?: string;
  email: string;
}

export interface AuthenticatedUser extends JwtUserPayload {
  id: number;
  username: string;
  bio: string;
  image: string;
}
