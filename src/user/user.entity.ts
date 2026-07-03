import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PostEntity } from "@/posts/post.entity";
import { RoleEntity } from "@/authorization/entities/role.entity";

@Entity("user")
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: "" })
  bio: string;

  @Column({ default: "" })
  image: string;

  @Column({ name: "passwordHash", select: false })
  passwordHash: string;

  @Column({ name: "refreshTokenHash", nullable: true, select: false })
  refreshTokenHash?: string | null;

  @Column({ default: false })
  emailVerified: boolean;

  // Verification/reset links carry a random token; only its SHA-256 hash is
  // stored, so a database leak can't be replayed as a working link.
  @Column({ type: "varchar", nullable: true, select: false })
  emailVerificationTokenHash?: string | null;

  @Column({ type: "timestamp", nullable: true, select: false })
  emailVerificationExpiresAt?: Date | null;

  @Column({ type: "varchar", nullable: true, select: false })
  passwordResetTokenHash?: string | null;

  @Column({ type: "timestamp", nullable: true, select: false })
  passwordResetExpiresAt?: Date | null;

  @ManyToMany(() => RoleEntity, (role) => role.users, {
    eager: true,
    cascade: false,
  })
  @JoinTable({
    name: "user_roles",
    joinColumn: { name: "userId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "roleId", referencedColumnName: "id" },
  })
  roles: RoleEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => PostEntity)
  @JoinTable()
  favorites: PostEntity[];

  @OneToMany(() => PostEntity, (post: PostEntity) => post.author)
  posts: PostEntity[];
}
