import { ArticleEntity } from "@/article/article.entity";
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

  @ManyToOne(() => ArticleEntity, (article) => article.comments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "articleId" })
  post: ArticleEntity;
}
