import { Role } from "../common/role.enum";

export interface UserData {
  username: string;
  email: string;
  token: string;
  bio: string;
  image: string;
  role: Role;
}

export interface UserRO {
  user: UserData;
}
