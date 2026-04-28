import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProfileData {
  @ApiProperty({ example: "john_doe" })
  username: string;

  @ApiPropertyOptional({ example: "Software developer from Vietnam." })
  bio: string;

  @ApiPropertyOptional({ example: "https://example.com/avatar.jpg" })
  image?: string;

  @ApiPropertyOptional({ example: false })
  following?: boolean;
}

export class ProfileRO {
  @ApiProperty({ type: ProfileData })
  profile: ProfileData;
}
