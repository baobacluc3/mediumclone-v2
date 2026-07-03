import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";

import { PermissionTupleDto } from "./permission-tuple.dto";

export class SetRolePermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionTupleDto)
  permissions: PermissionTupleDto[];
}
