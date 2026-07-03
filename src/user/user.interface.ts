export interface UserData {
  username: string;
  email: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  bio: string;
  image: string;
  roles: string[];
}

export interface UserRO {
  user: UserData;
}
