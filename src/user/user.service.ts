import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Not, Repository } from "typeorm";

import { CreateUserDto, LoginUserDto, UpdateUserDto } from "./dto";
import { UserEntity } from "./user.entity";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginUserDto) {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("LOWER(user.email) = :email", {
        email: dto.email.toLowerCase(),
      })
      .getOne();

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.buildUserResponse(user);
  }

  async findById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.buildUserResponse(user);
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  findByEmailWithPassword(email: string) {
    return this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email=:email", { email })
      .getOne();
  }

  create(email: string, passwordHash: string) {
    const user = this.userRepository.create({
      email,
      passwordHash,
    });

    return this.userRepository.save(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (dto.email || dto.username) {
      const existingUser = await this.userRepository.findOne({
        where: [
          dto.email
            ? {
                email: dto.email,
                id: Not(id),
              }
            : {},
          dto.username
            ? {
                username: dto.username,
                id: Not(id),
              }
            : {},
        ],
      });

      if (existingUser) {
        throw new ConflictException("Username or email already exists");
      }
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, dto);

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

    await this.userRepository.delete(id);

    return {
      message: "User deleted successfully",
    };
  }

  generateJWT(user: UserEntity) {
    return this.jwtService.sign({
      id: user.id,
      email: user.email,
    });
  }

  buildUserResponse(user: UserEntity) {
    return {
      user: {
        username: user.username,
        email: user.email,
        bio: user.bio || "",
        image: user.image || "",
        token: this.generateJWT(user),
      },
    };
  }
}
