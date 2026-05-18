import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "../user/user.entity";
import { TagEntity } from "../tag/tag.entity";
import { Comment } from "./comment.entity";

@Entity("articles")
export class ArticleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ default: "" })
  description: string;

  @Column({ type: "text", default: "" })
  body: string;

  @ManyToMany(() => TagEntity)
  @JoinTable({
    name: "article_tags",
    joinColumn: { name: "articleId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tagId", referencedColumnName: "id" },
  })
  tags: TagEntity[];

  @Column({ default: 0 })
  favoriteCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.articles, { eager: false })
  author: UserEntity;

  @OneToMany(() => Comment, (comment) => comment.article, {
    eager: true,
    cascade: true,
  })
  @JoinColumn()
  comments: Comment[];
}
