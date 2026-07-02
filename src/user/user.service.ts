import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { FindOptionsWhere, Not, Repository } from "typeorm";

import { UpdateUserDto } from "./dto";
import { UserEntity } from "./user.entity";
import { UserRole } from "@/auth/types/auth-user.type";
import { AuthTokens, JwtUserPayload } from "@/auth/auth.types";

interface BuildUserResponseOptions {
  includeToken?: boolean;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async findById(id: number) {
    const user = await this.findEntityById(id);

    return this.buildUserResponse(user);
  }

  async findEntityById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  findByEmailWithPassword(email: string) {
    return this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email=:email", { email: email.toLowerCase().trim() })
      .getOne();
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const nextEmail = dto.email?.toLowerCase().trim();
    const nextUsername = dto.username?.trim();
    const uniqueWhere: FindOptionsWhere<UserEntity>[] = [];

    if (nextEmail) {
      uniqueWhere.push({ email: nextEmail, id: Not(id) });
    }

    if (nextUsername) {
      uniqueWhere.push({ username: nextUsername, id: Not(id) });
    }

    if (uniqueWhere.length) {
      const existingUser = await this.userRepository.findOne({
        where: uniqueWhere,
      });

      if (existingUser) {
        throw new ConflictException("Username or email already exists");
      }
    }

    //Email, username and password are handled explicitly below.
    const { password, ...profileUpdates } = dto;
    delete profileUpdates.email;
    delete profileUpdates.username;

    Object.assign(user, profileUpdates);

    if (nextEmail) {
      user.email = nextEmail;
    }

    if (nextUsername) {
      user.username = nextUsername;
    }

    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await this.userRepository.save(user);

    return this.buildUserResponse(updatedUser);
  }

  async delete(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    //Same lockout protection as updateRoles: the system must always keep
    //at least one admin able to manage roles.
    if (user.roles?.includes(UserRole.ADMIN)) {
      await this.assertAnotherAdminExists(id);
    }

    await this.userRepository.delete(id);
  }

  async updateRoles(id: number, roles: UserRole[]) {
    const user = await this.findEntityById(id);
    const nextRoles = this.normalizeRoles(roles);

    if (
      user.roles?.includes(UserRole.ADMIN) &&
      !nextRoles.includes(UserRole.ADMIN)
    ) {
      await this.assertAnotherAdminExists(user.id);
    }

    user.roles = nextRoles;

    return this.buildUserResponse(
      await this.userRepository.save(user),
      undefined,
      {
        includeToken: false,
      },
    );
  }

  async refreshTokens(refreshToken: string) {
    let payload: JwtUserPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtUserPayload>(
        refreshToken,
        {
          secret: this.getRefreshTokenSecret(),
        },
      );
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    if (payload.tokenType !== "refresh") {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const userId = payload.sub ?? payload.id;
    if (!userId) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.refreshTokenHash")
      .where("user.id = :id", { id: userId })
      .getOne();

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return this.issueTokenPair(user);
  }

  async logout(userId: number) {
    await this.userRepository.update(userId, { refreshTokenHash: null });

    return {
      message: "Logged out successfully",
    };
  }

  async issueTokenPair(user: UserEntity): Promise<AuthTokens> {
    const tokens = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user),
    ]);

    await this.userRepository.update(user.id, {
      refreshTokenHash: await bcrypt.hash(tokens[1], 10),
    });

    return {
      accessToken: tokens[0],
      refreshToken: tokens[1],
    };
  }

  generateJWT(user: UserEntity) {
    return this.signAccessToken(user);
  }

  buildUserResponse(
    user: UserEntity,
    tokens?: AuthTokens,
    options: BuildUserResponseOptions = {},
  ) {
    const includeToken = options.includeToken ?? true;
    const accessToken = includeToken
      ? (tokens?.accessToken ?? this.generateJWT(user))
      : undefined;

    return {
      user: {
        username: user.username,
        email: user.email,
        bio: user.bio || "",
        image: user.image || "",
        ...(includeToken ? { token: accessToken, accessToken } : {}),
        ...(tokens?.refreshToken ? { refreshToken: tokens.refreshToken } : {}),
        roles: user.roles?.length ? user.roles : [UserRole.USER],
      },
    };
  }

  private signAccessToken(user: UserEntity) {
    return this.jwtService.sign(this.createTokenPayload(user, "access"), {
      secret: this.configService.getOrThrow<string>("JWT_SECRET"),
      expiresIn: this.configService.get<string>("JWT_ACCESS_EXPIRES_IN", "15m"),
    });
  }

  private signRefreshToken(user: UserEntity) {
    return this.jwtService.sign(this.createTokenPayload(user, "refresh"), {
      secret: this.getRefreshTokenSecret(),
      expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRES_IN", "7d"),
    });
  }

  private createTokenPayload(
    user: UserEntity,
    tokenType: JwtUserPayload["tokenType"],
  ): JwtUserPayload {
    return {
      sub: user.id,
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles?.length ? user.roles : [UserRole.USER],
      tokenType,
    };
  }

  private getRefreshTokenSecret() {
    return (
      this.configService.get<string>("JWT_REFRESH_SECRET") ??
      `${this.configService.getOrThrow<string>("JWT_SECRET")}:refresh`
    );
  }

  private normalizeRoles(roles: UserRole[]): UserRole[] {
    const normalizedRoles = [...new Set(roles ?? [])].filter((role) =>
      Object.values(UserRole).includes(role),
    );

    return normalizedRoles.length ? normalizedRoles : [UserRole.USER];
  }

  private async assertAnotherAdminExists(
    currentAdminId: number,
  ): Promise<void> {
    const adminCount = await this.userRepository
      .createQueryBuilder("user")
      .where("user.id != :currentAdminId", { currentAdminId })
      .andWhere("user.roles LIKE :adminRole", {
        adminRole: `%${UserRole.ADMIN}%`,
      })
      .getCount();

    if (adminCount === 0) {
      throw new ConflictException("At least one admin must remain.");
    }
  }
}
