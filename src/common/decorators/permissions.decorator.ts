import { SetMetadata } from "@nestjs/common";

import { REQUIRED_PERMISSIONS_KEY } from "@/auth/authorization/authorization.constants";
import { Permission } from "@/auth/permissions";

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
