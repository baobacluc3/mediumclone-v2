import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  MaxLength,
} from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  readonly username?: string;

  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  readonly password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  readonly bio?: string;

  @IsOptional()
  @IsUrl()
  readonly image?: string;
}
