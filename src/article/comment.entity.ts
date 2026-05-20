import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { PostEntity } from "./post.entity";
import { UserEntity } from "../user/user.entity";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text" })
  body: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => PostEntity, (post) => post.comments, {
    onDelete: "CASCADE",
  })
  post: PostEntity;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true })
  author: UserEntity;
}
