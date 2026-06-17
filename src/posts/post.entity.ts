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
import { CommentEntity } from "@/comment/comment.entity";
import { Bookmark } from "@/bookmark/bookmark.entity";

@Entity("posts")
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

  @ManyToOne(() => UserEntity, (user) => user.posts, { eager: false })
  author: UserEntity;

  @OneToMany(() => CommentEntity, (comment) => comment.post, {
    cascade: true,
  })
  @JoinColumn()
  comments: CommentEntity[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.post)
  bookmarks: Bookmark[];
}
