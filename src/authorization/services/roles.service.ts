import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { PermissionTuple } from "../domain/rbac.catalog";
import { CreateRoleDto, PermissionTupleDto, UpdateRoleDto } from "../dto";
import { RoleEntity } from "../entities/role.entity";
import { AuthorizationAuditService } from "./authorization-audit.service";
import { PermissionsService } from "./permissions.service";

const normalizeRoleName = (name: string): string => name.trim().toLowerCase();

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    private readonly permissionsService: PermissionsService,
    private readonly audit: AuthorizationAuditService,
  ) {}

  list(): Promise<RoleEntity[]> {
    return this.roleRepo.find({
      relations: ["permissions"],
      order: { name: "ASC" },
    });
  }

  async findById(id: number): Promise<RoleEntity> {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ["permissions"],
    });

    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    return role;
  }

  /** Look up persisted roles by name (case-insensitive), used when assigning. */
  async findByNames(names: string[]): Promise<RoleEntity[]> {
    const wanted = [
      ...new Set((names ?? []).map(normalizeRoleName).filter(Boolean)),
    ];

    if (!wanted.length) {
      return [];
    }

    return this.roleRepo.find({
      where: { name: In(wanted) },
      relations: ["permissions"],
    });
  }

  async create(dto: CreateRoleDto, actorId?: number): Promise<RoleEntity> {
    const name = normalizeRoleName(dto.name);

    if (await this.roleRepo.findOne({ where: { name } })) {
      throw new ConflictException(`Role "${name}" already exists`);
    }

    const role = this.roleRepo.create({
      name,
      description: dto.description ?? "",
      isSystem: false,
      permissions: await this.permissionsService.resolve(dto.permissions ?? []),
    });

    const saved = await this.roleRepo.save(role);
    this.audit.roleCreated({ actorId, role: name });

    return this.findById(saved.id);
  }

  async update(
    id: number,
    dto: UpdateRoleDto,
    actorId?: number,
  ): Promise<RoleEntity> {
    const role = await this.findById(id);

    if (dto.name && normalizeRoleName(dto.name) !== role.name) {
      if (role.isSystem) {
        throw new ForbiddenException("System roles cannot be renamed");
      }

      const nextName = normalizeRoleName(dto.name);
      if (await this.roleRepo.findOne({ where: { name: nextName } })) {
        throw new ConflictException(`Role "${nextName}" already exists`);
      }

      role.name = nextName;
    }

    if (dto.description !== undefined) {
      role.description = dto.description;
    }

    const saved = await this.roleRepo.save(role);
    this.audit.roleUpdated({ actorId, role: role.name, detail: "metadata" });

    return this.findById(saved.id);
  }

  async setPermissions(
    id: number,
    permissions: PermissionTupleDto[],
    actorId?: number,
  ): Promise<RoleEntity> {
    const role = await this.findById(id);
    role.permissions = await this.permissionsService.resolve(permissions);

    await this.roleRepo.save(role);
    this.audit.roleUpdated({
      actorId,
      role: role.name,
      detail: `permissions set (${role.permissions.length})`,
    });

    return this.findById(id);
  }

  async remove(id: number, actorId?: number): Promise<void> {
    const role = await this.findById(id);

    if (role.isSystem) {
      throw new ForbiddenException("System roles cannot be deleted");
    }

    await this.roleRepo.remove(role);
    this.audit.roleDeleted({ actorId, role: role.name });
  }

  /**
   * Resolve the deduplicated set of permissions granted by a list of role
   * names.
   */
  async resolvePermissionsForRoles(
    roleNames: string[],
  ): Promise<PermissionTuple[]> {
    const unique = [...new Set((roleNames ?? []).filter(Boolean))];

    if (!unique.length) {
      return [];
    }

    const lists = await Promise.all(
      unique.map((name) => this.getRolePermissions(name)),
    );

    const byKey = new Map<string, PermissionTuple>();
    for (const list of lists) {
      for (const permission of list) {
        byKey.set(`${permission.action}:${permission.subject}`, permission);
      }
    }

    return [...byKey.values()];
  }

  private async getRolePermissions(
    roleName: string,
  ): Promise<PermissionTuple[]> {
    const role = await this.roleRepo.findOne({
      where: { name: normalizeRoleName(roleName) },
      relations: ["permissions"],
    });

    return (role?.permissions ?? []).map((permission) => ({
      action: permission.action,
      subject: permission.subject,
    }));
  }
}
