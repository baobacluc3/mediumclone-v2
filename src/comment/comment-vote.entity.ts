import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
  Check,
  Index,
} from "typeorm";
import { CommentEntity } from "./comment.entity";
import { UserEntity } from "@/user/user.entity";

@Entity("comment_votes")
@Unique(["commentId", "userId"])
@Check(`"value" IN (-1, 1)`)
@Index(["userId"])
@Index(["commentId"])
export class CommentVote {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  commentId: number;

  @Column()
  userId: number;

  @Column({ type: "smallint" })
  value: 1 | -1;

  @ManyToOne(() => CommentEntity, (comment) => comment.votes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "commentId" })
  comment: CommentEntity;

  @ManyToOne(() => UserEntity, (user) => user.commentVotes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
