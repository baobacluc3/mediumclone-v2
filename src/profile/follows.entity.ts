import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

import { UserEntity } from "@/user/user.entity";

/**
 * A directed "follower → following" edge between two users. The pair is unique
 * (you can't follow someone twice) and each side carries a real foreign key with
 * `ON DELETE CASCADE`, so deleting a user automatically tears down every follow
 * edge that referenced them instead of leaving orphan integer rows behind.
 */
@Entity("follows")
@Unique(["followerId", "followingId"])
export class FollowsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  followerId: number;

  @Index()
  @Column()
  followingId: number;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "followerId" })
  follower: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "followingId" })
  following: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
