import { IsString, Length, MinLength } from "class-validator";

export class ResetPasswordDto {
  /** Raw token from the emailed link. */
  @IsString()
  @Length(1, 128)
  token: string;

  /** Same policy as registration. */
  @IsString()
  @MinLength(8)
  password: string;
}
