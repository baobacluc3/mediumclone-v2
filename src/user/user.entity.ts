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
import { UserRole } from "@/auth/types/auth-user.type";

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

  @Column({
    type: "simple-array",
    default: UserRole.USER,
  })
  roles: UserRole[];

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
