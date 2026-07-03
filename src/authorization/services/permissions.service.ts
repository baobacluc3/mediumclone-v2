import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PERMISSION_CATALOG, PermissionTuple } from "../domain/rbac.catalog";
import { PermissionEntity } from "../entities/permission.entity";

const keyOf = (tuple: PermissionTuple): string =>
  `${tuple.action}:${tuple.subject}`;

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionRepo: Repository<PermissionEntity>,
  ) {}

  list(): Promise<PermissionEntity[]> {
    return this.permissionRepo.find({
      order: { subject: "ASC", action: "ASC" },
    });
  }

  /**
   * Resolve (action, subject) tuples to their persisted rows, failing loudly if
   * any are unknown so callers can't grant a role a non-existent permission.
   */
  async resolve(tuples: PermissionTuple[]): Promise<PermissionEntity[]> {
    if (!tuples?.length) {
      return [];
    }

    const all = await this.permissionRepo.find();
    const byKey = new Map(
      all.map((permission) => [keyOf(permission), permission]),
    );

    const resolved: PermissionEntity[] = [];
    const missing: string[] = [];

    for (const tuple of tuples) {
      const match = byKey.get(keyOf(tuple));
      if (match) {
        resolved.push(match);
      } else {
        missing.push(keyOf(tuple));
      }
    }

    if (missing.length) {
      throw new BadRequestException(
        `Unknown permission(s): ${[...new Set(missing)].join(", ")}`,
      );
    }

    return resolved;
  }

  /**
   * Idempotently ensure every catalog permission exists and its description is
   * up to date. Safe to run on every boot.
   */
  async syncCatalog(): Promise<void> {
    const existing = await this.permissionRepo.find();
    const byKey = new Map(
      existing.map((permission) => [keyOf(permission), permission]),
    );
    const toSave: PermissionEntity[] = [];

    for (const definition of PERMISSION_CATALOG) {
      const current = byKey.get(keyOf(definition));

      if (!current) {
        toSave.push(this.permissionRepo.create(definition));
      } else if (current.description !== definition.description) {
        current.description = definition.description;
        toSave.push(current);
      }
    }

    if (toSave.length) {
      await this.permissionRepo.save(toSave);
    }
  }
}
