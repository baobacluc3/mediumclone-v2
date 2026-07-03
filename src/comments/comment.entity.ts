import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PostEntity } from "../posts/post.entity";
import { UserEntity } from "../user/user.entity";

@Entity("comments")
// Comments are always listed per post, newest first.
@Index("idx_comments_post_created_at", ["postId", "createdAt"])
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text" })
  body: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  authorId: number;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "authorId" })
  author: UserEntity;

  @Column()
  postId: number;

  @ManyToOne(() => PostEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "postId" })
  post: PostEntity;
}
