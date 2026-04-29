import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import * as jwt from "jsonwebtoken";
import { Repository } from "typeorm";
import { CreateUserDto, LoginUserDto, UpdateUserDto } from "./dto";
import { UserEntity } from "./user.entity";
import { UserRO } from "./user.interface";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
  ) {}

  async findOne({ email, password }: LoginUserDto): Promise<UserEntity | null> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();

    if (!user) {
      return null;
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    return isPasswordValid ? user : null;
  }

  async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  async findById(id: number): Promise<UserRO> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    return this.buildUserRO(user);
  }

  async findByEmail(email: string): Promise<UserRO> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException(`User with email "${email}" not found`);
    }

    return this.buildUserRO(user);
  }

  async create(dto: CreateUserDto): Promise<UserRO> {
    const { username, email, password } = dto;
    const exists = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (exists) {
      throw new ConflictException("Username or email is already taken.");
    }

    const newUser = this.userRepository.create({
      username,
      email,
      password: await argon2.hash(password),
    });

    const savedUser = await this.userRepository.save(newUser);
    this.logger.log(`User created: ${savedUser.email}`);
    return this.buildUserRO(savedUser);
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserRO> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    const updatedData = { ...dto };

    if (updatedData.password) {
      updatedData.password = await argon2.hash(updatedData.password);
    }

    const updated = this.userRepository.merge(user, updatedData);
    const savedUser = await this.userRepository.save(updated);
    return this.buildUserRO(savedUser);
  }

  async delete(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    await this.userRepository.delete(id);
    this.logger.log(`User #${id} deleted`);
  }

  generateJWT(user: UserEntity): string {
    const secret = this.configService.getOrThrow<string>("JWT_SECRET");

    return jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      secret,
      { expiresIn: "7d" },
    );
  }

  private buildUserRO(user: UserEntity): UserRO {
    return {
      user: {
        username: user.username,
        email: user.email,
        bio: user.bio ?? "",
        image: user.image ?? "",
        token: this.generateJWT(user),
      },
    };
  }
}
