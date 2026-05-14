import { SetMetadata } from "@nestjs/common";
import { Role } from "../../common/role.enum";

// This key is the name used to store and read role metadata on route handlers.
export const ROLES_KEY = "roles";

// @Roles(Role.ADMIN) writes metadata that RolesGuard can read before the controller runs.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
