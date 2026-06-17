import { SetMetadata } from "@nestjs/common";

import { REQUIRED_ROLES_KEY } from "@/auth/authorization/authorization.constants";
import { UserRole } from "@/auth/types/auth-user.type";

export const Roles = (...roles: UserRole[]) =>
  SetMetadata(REQUIRED_ROLES_KEY, roles);
