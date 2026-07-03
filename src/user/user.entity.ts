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
