import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

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

  @CreateDateColumn()
  createdAt: Date;
}
