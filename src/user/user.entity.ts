import { IsEmail } from "class-validator";
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
import { PostEntity } from "../post/post.entity";
import { CommentEntity } from "@/comment/comment.entity";

@Entity("user")
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ default: "" })
  bio: string;

  @Column({ default: "" })
  image: string;

  @Column({ name: "passwordHash", select: false })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => PostEntity)
  @JoinTable()
  favorites: PostEntity[];

  @OneToMany(() => PostEntity, (post) => post.author)
  posts: PostEntity[];

  comments: CommentEntity[];
}
