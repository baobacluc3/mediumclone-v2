import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { ArticleEntity } from "./article.entity";
import { UserEntity } from "../../user/user.entity";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text" })
  body: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ArticleEntity, (article) => article.comments, {
    onDelete: "CASCADE",
  })
  article: ArticleEntity;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true })
  author: UserEntity;
}
