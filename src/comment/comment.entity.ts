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

@Entity("comments")
@Index(["postId", "parentId", "createdAt"])
@Index(["postId", "parentId", "score"])
@Index(["postId", "rootId"])
@Index(["authorId", "createdAt"])

export enum CommentStatus {
  ACTIVE = 'active', 
  DELETED = 'deleted',

  REMOVED = 'removed',
  SPAM = 'spam',
}

export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column()
  postId: number; 

  @Column()
  authorId: number; 

  @Column({ nullable: true })
  parentId?: number;

  @Column({ nullable: true })
  rootId: string | null;

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



  @ManyToOne(() => UserEntity, (user) => user.comments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "authorId" })
  author: UserEntity;


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

@Column({ type: 'int', default: 0 })
replyCount: number; 

@Column({ type: 'timestamp', nullable: true })
editedAt: Date | null; 




@DeleteDateColumn()
deletedAt: Date | null;

@CreateDateColumn()
createdAt: Date; 


@UpdateDateColumn()
updatedAt: Date;  


 @ManyToOne(() => PostEntity, (post) => post.comments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "postId" })
  post: PostEntity;


 
}


