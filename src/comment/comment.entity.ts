import { PostEntity } from "@/posts/post.entity";
import { UserEntity } from "@/user/user.entity";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CommentVote } from "./comment-vote.entity";

export enum CommentStatus {
  ACTIVE = "active",
  DELETED = "deleted",
  REMOVED = "removed",
  SPAM = "spam",
}

@Entity("comments")
@Index(["postId", "parentId", "createdAt"])
@Index(["postId", "parentId", "score"])
@Index(["postId", "rootId"])
@Index(["authorId", "createdAt"])
@Index("idx_comments_post_created_at", ["postId", "createdAt"])
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text" })
  body: string;

  @Column()
  postId: number;

  @Column()
  authorId: number;

  @Column({ nullable: true })
  parentId?: number;

  @Column({ nullable: true })
  rootId: number | null;

  @Column({ type: "int", default: 0 })
  depth: number;

  @Column({ type: "varchar", length: 500, nullable: true })
  path: string | null;

  @Column({
    type: "enum",
    enum: CommentStatus,
    default: CommentStatus.ACTIVE,
  })
  status: CommentStatus;

  @Column({ type: "int", default: 0 })
  upvoteCount: number;

  @Column({ type: "int", default: 0 })
  downvoteCount: number;

  @Column({ type: "int", default: 0 })
  score: number;

  @Column({ type: "int", default: 0 })
  replyCount: number;

  @Column({ type: "timestamp", nullable: true })
  editedAt: Date | null;

  @ManyToOne(() => UserEntity, (user) => user.comments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "authorId" })
  author: UserEntity;

  @ManyToOne(() => PostEntity, (post) => post.comments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "postId" })
  post: PostEntity;

  @ManyToOne(() => CommentEntity, (comment) => comment.children, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parentId" })
  parent: CommentEntity | null;

  @OneToMany(() => CommentEntity, (comment) => comment.parent)
  children: CommentEntity[];

  @OneToMany(() => CommentVote, (vote) => vote.comment)
  votes: CommentVote[];

  @DeleteDateColumn()
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
