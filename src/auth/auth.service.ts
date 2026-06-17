import { UserEntity } from "@/user/user.entity";
import { UserService } from "../user/user.service";
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RegisterDto } from "./dto/register.dto";
import { LoginUserDto } from "./dto/login.dto";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username?.trim() || email.split("@")[0];

    const existingUser = await this.userService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException("email already exists");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepository.save(
      this.userRepository.create({
        email,
        username,
        passwordHash: hashedPassword,
      }),
    );

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async login(dto: LoginUserDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException("Invalid email or password");
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid)
      throw new UnauthorizedException("Invalid email or password");

    const accessToken = await this.signAccessToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      accessToken,
    };
  }

  private signAccessToken(userId: number, email: string) {
    const payload = {
      id: userId,
      email,
    };

    return this.jwtService.signAsync(payload);
  }
}
