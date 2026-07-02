import {
  Get,
  Post,
  Delete,
  Param,
  Controller,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { ProfileRO } from "./profile.interface";
import { User } from "../common/decorators/user.decorator";
import { Public } from "@/common/decorators/public.decorator";

@Controller("profiles")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Public()
  @Get(":username")
  async getProfile(
    @User("id") userId: number,
    @Param("username") username: string,
  ): Promise<ProfileRO> {
    return this.profileService.findProfile(userId, username);
  }

  @Post(":username/follow")
  @HttpCode(HttpStatus.OK)
  async follow(
    @User("email") email: string,
    @Param("username") username: string,
  ): Promise<ProfileRO> {
    return this.profileService.follow(email, username);
  }

  @Delete(":username/follow")
  @HttpCode(HttpStatus.OK)
  async unFollow(
    @User("id") userId: number,
    @Param("username") username: string,
  ): Promise<ProfileRO> {
    return this.profileService.unFollow(userId, username);
  }
}
