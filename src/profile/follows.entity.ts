import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from "typeorm";

@Entity("follows")
@Unique(["followerId", "followingId"]) // Prevent duplicate follow records at DB level
export class FollowsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  followerId: number;

  @Index()
  @Column()
  followingId: number;

  @CreateDateColumn()
  createdAt: Date;
}
