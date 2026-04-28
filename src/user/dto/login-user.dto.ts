import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginUserDto {
  @ApiProperty({ example: "john@example.com" })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: "strongPassword123" })
  @IsNotEmpty()
  @IsString()
  readonly password: string;
}
