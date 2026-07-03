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
import { AuthenticatedUser } from "./auth.types";
import { DEFAULT_ROLE_NAME } from "@/authorization/domain/rbac.catalog";
import { RolesService } from "@/authorization/services/roles.service";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly rolesService: RolesService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username?.trim() || email.split("@")[0];

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException("email already exists");
      }

      throw new ConflictException("username already exists");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const defaultRoles = await this.rolesService.findByNames([
      DEFAULT_ROLE_NAME,
    ]);

    const user = await this.userRepository.save(
      this.userRepository.create({
        email,
        username,
        passwordHash: hashedPassword,
        roles: defaultRoles,
      }),
    );

    const tokens = await this.userService.issueTokenPair(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        roles: this.roleNames(user),
        createdAt: user.createdAt,
      },
      ...tokens,
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

    const tokens = await this.userService.issueTokenPair(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        roles: this.roleNames(user),
      },
      ...tokens,
    };
  }

  refresh(refreshToken: string) {
    return this.userService.refreshTokens(refreshToken);
  }

  logout(user: AuthenticatedUser) {
    return this.userService.logout(user.id);
  }

  private roleNames(user: UserEntity): string[] {
    return user.roles?.length
      ? user.roles.map((role) => role.name)
      : [DEFAULT_ROLE_NAME];
  }
}
