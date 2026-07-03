import { IsEnum } from "class-validator";

import { Action } from "../domain/action.enum";
import { AppSubject } from "../domain/app-subject.enum";

/** A single capability reference used when granting permissions to a role. */
export class PermissionTupleDto {
  @IsEnum(Action)
  action: Action;

  @IsEnum(AppSubject)
  subject: AppSubject;
}
