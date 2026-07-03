import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { UserEntity } from "../user/user.entity";
import { TagEntity } from "../tag/tag.entity";

@Entity("posts")
@Index("idx_posts_created_at", ["createdAt"])
@Index("idx_posts_author_created_at", ["authorId", "createdAt"])
// Supports the "most favorited" ordering used by the popular feed without a
// sort-node over the whole table.
@Index("idx_posts_favorite_count", ["favoriteCount"])
export class PostEntity {
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
    name: "post_tags",
    joinColumn: { name: "postId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tagId", referencedColumnName: "id" },
  })
  tags: TagEntity[];

  @Column({ default: 0 })
  favoriteCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  authorId: number;

  @ManyToOne(() => UserEntity, (user) => user.posts, {
    eager: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "authorId" })
  author: UserEntity;
}
