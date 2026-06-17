import { PostEntity } from "@/posts/post.entity";
import { UserEntity } from "@/user/user.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  JoinColumn,
} from "typeorm";

@Entity("bookmarks")
@Unique(["userId", "postId"])
export class Bookmark {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: number;

  @Column()
  postId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.bookmarks, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: UserEntity;

  @ManyToOne(() => PostEntity, (post) => post.bookmarks, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "postId" })
  post: PostEntity;
}
