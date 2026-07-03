import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

import { Action } from "../domain/action.enum";
import { AppSubject } from "../domain/app-subject.enum";
import { RoleEntity } from "./role.entity";

/**
 * A single capability expressed as an (action, subject) pair, e.g.
 * `create` + `Article`. Permissions are data, not code: the catalog is seeded
 * on boot and roles reference these rows through the `role_permissions` join.
 */
@Entity("permission")
@Unique("uq_permission_action_subject", ["action", "subject"])
export class PermissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar" })
  action: Action;

  @Column({ type: "varchar" })
  subject: AppSubject;

  @Column({ default: "" })
  description: string;

  @ManyToMany(() => RoleEntity, (role) => role.permissions)
  roles?: RoleEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /** Stable string identifier, e.g. `"create:Article"`. */
  get key(): string {
    return `${this.action}:${this.subject}`;
  }
}
