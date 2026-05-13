export class ProfileData {
  username: string;

  bio: string;

  image?: string;

  following?: boolean;
}

export class ProfileRO {
  profile: ProfileData;
}
