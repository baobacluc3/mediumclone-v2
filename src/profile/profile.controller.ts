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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ProfileService } from "./profile.service";
import { ProfileRO } from "./profile.interface";
import { User } from "../user/user.decorator";
import { JwtAuthGuard, OptionalJwtAuthGuard } from "../user/jwt-auth.guard";

@ApiBearerAuth()
@ApiTags("Profiles")
@Controller("profiles")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(":username")
  @ApiOperation({ summary: "Get a user profile by username" })
  @ApiParam({ name: "username", example: "john_doe" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Profile found.",
    type: ProfileRO,
  })
  @ApiNotFoundResponse({ description: "User not found." })
  @UseGuards(OptionalJwtAuthGuard)
  async getProfile(
    @User("id") userId: number,
    @Param("username") username: string,
  ): Promise<ProfileRO> {
    return this.profileService.findProfile(userId, username);
  }

  @Post(":username/follow")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Follow a user" })
  @ApiParam({ name: "username", example: "john_doe" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Successfully followed the user.",
    type: ProfileRO,
  })
  @ApiNotFoundResponse({ description: "Target user not found." })
  @ApiBadRequestResponse({ description: "Cannot follow yourself." })
  @ApiConflictResponse({ description: "Already following this user." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @UseGuards(JwtAuthGuard)
  async follow(
    @User("email") email: string,
    @Param("username") username: string,
  ): Promise<ProfileRO> {
    return this.profileService.follow(email, username);
  }

  @Delete(":username/follow")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Unfollow a user" })
  @ApiParam({ name: "username", example: "john_doe" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Successfully unfollowed the user.",
    type: ProfileRO,
  })
  @ApiNotFoundResponse({ description: "Target user not found." })
  @ApiBadRequestResponse({
    description: "Cannot unfollow yourself or not currently following.",
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @UseGuards(JwtAuthGuard)
  async unFollow(
    @User("id") userId: number,
    @Param("username") username: string,
  ): Promise<ProfileRO> {
    return this.profileService.unFollow(userId, username);
  }
}
