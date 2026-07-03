import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roles: string[];
}
