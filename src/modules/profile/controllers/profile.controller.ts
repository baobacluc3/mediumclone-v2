import {
  Get,
  Post,
  Delete,
  Param,
  Controller,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ProfileService } from "../services/profile.service";
import { ProfileRO } from "../interfaces/profile.interface";
import { User } from "../../../common/decorators/user.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";

@Controller("profiles")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(":username")
  async getProfile(
    @User("id") userId: number,
    @Param("username") username: string,
  ): Promise<ProfileRO> {
    return this.profileService.findProfile(userId, username);
  }

  @Post(":username/follow")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async follow(
    @User("email") email: string,
    @Param("username") username: string,
  ): Promise<ProfileRO> {
    return this.profileService.follow(email, username);
  }

  @Delete(":username/follow")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async unFollow(
    @User("id") userId: number,
    @Param("username") username: string,
  ): Promise<ProfileRO> {
    return this.profileService.unFollow(userId, username);
  }
}
