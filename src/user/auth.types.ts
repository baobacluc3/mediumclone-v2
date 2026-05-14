import { Role } from "../common/role.enum";

export interface JwtUserPayload {
  id: number;
  username: string;
  email: string;
  role: Role;
}

export interface AuthenticatedUser extends JwtUserPayload {
  bio: string;
  image: string;
}
