import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { UserEntity } from "@/user/user.entity";
import { PermissionEntity } from "./permission.entity";

/**
 * A named bundle of permissions that can be assigned to users. System roles
 * (`isSystem = true`) are seeded and protected from deletion; additional roles
 * can be created at runtime through the admin API.
 */
@Entity("role")
export class RoleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ default: "" })
  description: string;

  /** Seeded, structurally-required roles that callers may not delete. */
  @Column({ default: false })
  isSystem: boolean;

  @ManyToMany(() => PermissionEntity, (permission) => permission.roles, {
    cascade: false,
  })
  @JoinTable({
    name: "role_permissions",
    joinColumn: { name: "roleId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "permissionId", referencedColumnName: "id" },
  })
  permissions: PermissionEntity[];

  @ManyToMany(() => UserEntity, (user) => user.roles)
  users?: UserEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
