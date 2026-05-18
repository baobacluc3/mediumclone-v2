import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { CreateUserDto, LoginUserDto, UpdateUserDto } from "./dto";
import { UserRO } from "./user.interface";
import { UserService } from "./user.service";
import { User } from "../common/decorators/user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@Controller()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get("user")
  @UseGuards(JwtAuthGuard)
  async findMe(@User("id") userId: number): Promise<UserRO> {
    return this.userService.findById(userId);
  }

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
    const user = await this.userService.findOne(dto);

    this.logger.log(`User logged in: ${user.email}`);
    return this.userService.buildUserRO(user);
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
