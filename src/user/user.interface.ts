import { UserRole } from "@/auth/types/auth-user.type";

export interface UserData {
  username: string;
  email: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  bio: string;
  image: string;
  roles: UserRole[];
}

export interface UserRO {
  user: UserData;
}
