import { IsString, Length } from "class-validator";

export class VerifyEmailDto {
  /** Raw token from the emailed link (64 hex chars). */
  @IsString()
  @Length(1, 128)
  token: string;
}
