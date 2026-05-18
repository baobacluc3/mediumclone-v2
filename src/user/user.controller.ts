import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { CreateUserDto, LoginUserDto, UpdateUserDto } from "./dto";
import { UserRO } from "./user.interface";
import { UserService } from "./user.service";
import { User } from "./user.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put("user")
  @UseGuards(JwtAuthGuard)
  async update(
    @User("id") userId: number,
    @Body("user") dto: UpdateUserDto,
  ): Promise<UserRO> {
    return this.userService.update(userId, dto);
  }

  @Post("users")
  async create(@Body("user") dto: CreateUserDto): Promise<UserRO> {
    return this.userService.create(dto);
  }

  @Post("users/login")
  async login(@Body("user") dto: LoginUserDto): Promise<UserRO> {
    const user = await this.userService.validateUser(dto);

    if (!user) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const token = this.userService.generateJWT(user);
    const { email, username, bio, image } = user;

    return { user: { email, token, username, bio, image } };
  }

  @Delete("users/:id")
  @UseGuards(JwtAuthGuard)
  async delete(
    @User("id") currentUserId: number,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<void> {
    if (currentUserId !== id) {
      throw new ForbiddenException("You can only delete your own account.");
    }

    await this.userService.delete(id);
  }
}
