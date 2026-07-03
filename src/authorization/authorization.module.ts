import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";

import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { UserEntity } from "@/user/user.entity";
import { CaslAbilityFactory } from "./abilities/casl-ability.factory";
import { AuthorizationAdminController } from "./controllers/authorization-admin.controller";
import { PermissionEntity } from "./entities/permission.entity";
import { RoleEntity } from "./entities/role.entity";
import { PoliciesGuard } from "./guards/policies.guard";
import { RbacSeeder } from "./seeds/rbac.seeder";
import { AuthorizationAuditService } from "./services/authorization-audit.service";
import { PermissionsService } from "./services/permissions.service";
import { RolesService } from "./services/roles.service";

/**
 * Central, global authorization module. Registers the authentication and
 * policy guards application-wide (so individual modules need no per-route
 * wiring) and exposes the ability factory and role/permission services to the
 * rest of the app.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([RoleEntity, PermissionEntity, UserEntity]),
  ],
  controllers: [AuthorizationAdminController],
  providers: [
    PermissionsService,
    RolesService,
    AuthorizationAuditService,
    CaslAbilityFactory,
    RbacSeeder,
    // Order matters: authenticate first, then authorize.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PoliciesGuard },
  ],
  exports: [
    CaslAbilityFactory,
    RolesService,
    PermissionsService,
    AuthorizationAuditService,
  ],
})
export class AuthorizationModule {}
