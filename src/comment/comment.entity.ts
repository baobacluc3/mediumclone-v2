import { PostEntity } from "@/post/post.entity";
import { UserEntity } from "@/user/user.entity";
import { JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  content: string;

  postId: string;

  authorId: number;

  parentId?: number;

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
}
