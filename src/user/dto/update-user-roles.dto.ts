import { IsArray, IsEnum, ArrayNotEmpty } from "class-validator";

import { UserRole } from "@/auth/types/auth-user.type";

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];
}
