import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginUserDto {
  email: string;

  password: string;
}
