import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../user/user.entity";
import { FollowsEntity } from "./follows.entity";
import { ProfileData, ProfileRO } from "./profile.interface";

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowsEntity)
    private readonly followsRepository: Repository<FollowsEntity>,
  ) {}

  async findProfile(
    currentUserId: number,
    username: string,
  ): Promise<ProfileRO> {
    const targetUser = await this.userRepository.findOne({
      where: { username },
    });

    if (!targetUser) {
      throw new NotFoundException(`User "${username}" not found.`);
    }

    const profile: ProfileData = {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: false,
    };

    if (currentUserId) {
      const followRecord = await this.followsRepository.findOne({
        where: { followerId: currentUserId, followingId: targetUser.id },
      });
      profile.following = !!followRecord;
    }

    return { profile };
  }

  async follow(followerEmail: string, username: string): Promise<ProfileRO> {
    const [followerUser, followingUser] = await Promise.all([
      this.userRepository.findOne({ where: { email: followerEmail } }),
      this.userRepository.findOne({ where: { username } }),
    ]);

    if (!followerUser) {
      throw new NotFoundException("Authenticated user not found.");
    }

    if (!followingUser) {
      throw new NotFoundException(`User "${username}" not found.`);
    }

    if (followerUser.id === followingUser.id) {
      throw new BadRequestException("You cannot follow yourself.");
    }

    const alreadyFollowing = await this.followsRepository.findOne({
      where: { followerId: followerUser.id, followingId: followingUser.id },
    });

    if (alreadyFollowing) {
      throw new ConflictException(`You are already following "${username}".`);
    }

    await this.followsRepository.save(
      this.followsRepository.create({
        followerId: followerUser.id,
        followingId: followingUser.id,
      }),
    );

    return {
      profile: {
        username: followingUser.username,
        bio: followingUser.bio,
        image: followingUser.image,
        following: true,
      },
    };
  }

  async unFollow(followerId: number, username: string): Promise<ProfileRO> {
    const followingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (!followingUser) {
      throw new NotFoundException(`User "${username}" not found.`);
    }

    if (followingUser.id === followerId) {
      throw new BadRequestException("You cannot unfollow yourself.");
    }

    const followRecord = await this.followsRepository.findOne({
      where: { followerId, followingId: followingUser.id },
    });

    if (!followRecord) {
      throw new BadRequestException(`You are not following "${username}".`);
    }

    await this.followsRepository.remove(followRecord);

    return {
      profile: {
        username: followingUser.username,
        bio: followingUser.bio,
        image: followingUser.image,
        following: false,
      },
    };
  }
}
