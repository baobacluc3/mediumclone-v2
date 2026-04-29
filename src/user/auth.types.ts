export interface JwtUserPayload {
  id: number;
  username: string;
  email: string;
}

export interface AuthenticatedUser extends JwtUserPayload {
  bio: string;
  image: string;
}
