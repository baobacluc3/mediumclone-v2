import {
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Controller,
  UsePipes,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";

import { UserService } from "./user.service";
import { UserRO } from "./user.interface";
import { CreateUserDto, UpdateUserDto, LoginUserDto } from "./dto";
import { ValidationPipe } from "../shared/pipes/validation.pipe";
import { User } from "./user.decorator";

@ApiBearerAuth()
@ApiTags("Users")
@UsePipes(new ValidationPipe())
@Controller()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  // GET /user — current authenticated user
  @Get("user")
  @ApiOperation({ summary: "Get current authenticated user" })
  @ApiResponse({ status: 200, description: "Returns the logged-in user." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  async findMe(@User("email") email: string): Promise<UserRO> {
    return this.userService.findByEmail(email);
  }

  // PUT /user — update current authenticated user
  @Put("user")
  @ApiOperation({ summary: "Update current authenticated user" })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: "User updated successfully." })
  @ApiResponse({ status: 400, description: "Validation failed." })
  async update(
    @User("id") userId: number,
    @Body("user") dto: UpdateUserDto,
  ): Promise<UserRO> {
    return this.userService.update(userId, dto);
  }

  // POST /users — register a new user
  @Post("users")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a new user" })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: "User created successfully." })
  @ApiResponse({ status: 400, description: "Validation failed." })
  @ApiResponse({ status: 409, description: "Username or email already taken." })
  async create(@Body("user") dto: CreateUserDto): Promise<UserRO> {
    return this.userService.create(dto);
  }

  // POST /users/login
  @Post("users/login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({ status: 200, description: "Login successful." })
  @ApiResponse({ status: 401, description: "Invalid credentials." })
  async login(@Body("user") dto: LoginUserDto): Promise<UserRO> {
    const user = await this.userService.findOne(dto);

    if (!user) {
      // Generic message prevents email enumeration attacks
      throw new UnauthorizedException("Invalid email or password.");
    }

    const token = this.userService.generateJWT(user);
    const { email, username, bio, image } = user;

    this.logger.log(`User logged in: ${email}`);
    return { user: { email, token, username, bio, image } };
  }

  // DELETE /users/:id
  @Delete("users/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a user by ID" })
  @ApiParam({ name: "id", type: Number, description: "User ID" })
  @ApiResponse({ status: 204, description: "User deleted successfully." })
  @ApiResponse({ status: 404, description: "User not found." })
  async delete(@Param("id", ParseIntPipe) id: number): Promise<void> {
    await this.userService.delete(id);
  }
}
