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
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get("user")
  @UseGuards(JwtAuthGuard)
  async findMe(@User("email") email: string): Promise<UserRO> {
    return this.userService.findByEmail(email);
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

    if (!user) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const token = this.userService.generateJWT(user);
    const { email, username, bio, image, role } = user;

    this.logger.log(`User logged in: ${email}`);
    return { user: { email, token, username, bio, image, role } };
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
