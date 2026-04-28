import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ example: "johndoe" })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  readonly username: string;

  @ApiProperty({ example: "john@example.com" })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: "strongPassword123" })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  readonly password: string;
}
