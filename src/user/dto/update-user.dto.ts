import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  MaxLength,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserDto {
  @ApiPropertyOptional({ example: "johndoe" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  readonly username?: string;

  @ApiPropertyOptional({ example: "john@example.com" })
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ApiPropertyOptional({ example: "newStrongPassword123" })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  readonly password?: string;

  @ApiPropertyOptional({ example: "I love writing articles." })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  readonly bio?: string;

  @ApiPropertyOptional({ example: "https://example.com/avatar.jpg" })
  @IsOptional()
  @IsUrl()
  readonly image?: string;
}
