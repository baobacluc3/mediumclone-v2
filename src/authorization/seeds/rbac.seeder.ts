import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UserEntity } from "@/user/user.entity";
import { BOOTSTRAP_ADMIN_EMAIL_ENV } from "../domain/authorization.constants";
import {
  DEFAULT_ROLE_NAME,
  DefaultRole,
  ROLE_CATALOG,
} from "../domain/rbac.catalog";
import { RoleEntity } from "../entities/role.entity";
import { PermissionsService } from "../services/permissions.service";

/**
 * Seeds the RBAC catalog on every boot. All steps are idempotent: permissions
 * and system roles are upserted to match the code-defined catalog, users
 * without roles are given the default role, and an optional bootstrap admin is
 * promoted from an env var so the first administrator can exist on a fresh DB.
 */
@Injectable()
export class RbacSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(RbacSeeder.name);

  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly permissionsService: PermissionsService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.permissionsService.syncCatalog();
      await this.seedSystemRoles();
      await this.backfillUserRoles();
      await this.ensureBootstrapAdmin();
      this.logger.log("RBAC catalog seeded");
    } catch (error) {
      this.logger.error(
        `RBAC seeding failed; authorization may be misconfigured: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async seedSystemRoles(): Promise<void> {
    for (const definition of ROLE_CATALOG) {
      const permissions = await this.permissionsService.resolve(
        definition.permissions,
      );

      let role = await this.roleRepo.findOne({
        where: { name: definition.name },
        relations: ["permissions"],
      });

      if (!role) {
        role = this.roleRepo.create({ name: definition.name });
      }

      role.description = definition.description;
      role.isSystem = true;
      role.permissions = permissions;

      await this.roleRepo.save(role);
    }
  }

  private async backfillUserRoles(): Promise<void> {
    const defaultRole = await this.roleRepo.findOne({
      where: { name: DEFAULT_ROLE_NAME },
    });

    if (!defaultRole) {
      return;
    }

    const usersWithoutRoles = await this.userRepo
      .createQueryBuilder("user")
      .leftJoin("user.roles", "role")
      .where("role.id IS NULL")
      .getMany();

    for (const user of usersWithoutRoles) {
      await this.userRepo
        .createQueryBuilder()
        .relation(UserEntity, "roles")
        .of(user.id)
        .add(defaultRole.id);
    }

    if (usersWithoutRoles.length) {
      this.logger.log(
        `Assigned default role to ${usersWithoutRoles.length} user(s) without roles`,
      );
    }
  }

  private async ensureBootstrapAdmin(): Promise<void> {
    const email = this.configService
      .get<string>(BOOTSTRAP_ADMIN_EMAIL_ENV)
      ?.toLowerCase()
      .trim();

    if (!email) {
      return;
    }

    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      this.logger.warn(
        `Bootstrap admin email "${email}" not found; no admin promoted`,
      );
      return;
    }

    const adminRole = await this.roleRepo.findOne({
      where: { name: DefaultRole.Admin },
    });

    if (!adminRole) {
      return;
    }

    const alreadyAdmin = (user.roles ?? []).some(
      (role) => role.name === DefaultRole.Admin,
    );

    if (alreadyAdmin) {
      return;
    }

    await this.userRepo
      .createQueryBuilder()
      .relation(UserEntity, "roles")
      .of(user.id)
      .add(adminRole.id);

    this.logger.log(`Granted admin role to bootstrap user "${email}"`);
  }
}
