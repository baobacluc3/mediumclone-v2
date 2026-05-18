import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { Not, Repository } from "typeorm";
import { CreateUserDto, LoginUserDto, UpdateUserDto } from "./dto";
import { UserEntity } from "./user.entity";
import { UserRO } from "./user.interface";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly duplicateMessage = "Username or email is already taken.";

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async findOne({ email, password }: LoginUserDto): Promise<UserEntity> {
    const normalizedEmail = this.normalizeEmail(email);
    const foundUser = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password") // required because the column has select: false
      .where("LOWER(user.email) = :email", { email: normalizedEmail })
      .getOne();

    if (!foundUser) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const isMatching = await this.validatePassword(
      password,
      foundUser.password,
    );
    if (!isMatching) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    return foundUser;
  }

  private async validatePassword(
    plain: string,
    hashed: string,
  ): Promise<boolean> {
    return argon2.verify(hashed, plain);
  }

  async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  async findById(id: number): Promise<UserRO> {
    const user = await this.findEntityById(id);
    return this.buildUserRO(user);
  }

  async findEntityById(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserRO> {
    const user = await this.userRepository.findOne({
      where: { email: this.normalizeEmail(email) },
    });

    if (!user) {
      throw new NotFoundException(`User with email "${email}" not found`);
    }

    return this.buildUserRO(user);
  }

  async create(dto: CreateUserDto): Promise<UserRO> {
    const username = this.normalizeUsername(dto.username);
    const email = this.normalizeEmail(dto.email);

    await this.ensureUserIsUnique({ username, email });

    const newUser = this.userRepository.create({
      username,
      email,
      password: await this.hashPassword(dto.password),
    });

    try {
      const savedUser = await this.userRepository.save(newUser);
      this.logger.log(`User created: ${savedUser.email}`);
      return this.buildUserRO(savedUser);
    } catch (error) {
      this.throwConflictOnUniqueViolation(error);
      throw error;
    }
  }

  private async hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain);
  }

  async update(id: number, dto: UpdateUserDto = {}): Promise<UserRO> {
    const user = await this.findEntityById(id);
    const updatedData = this.normalizeUpdateDto(dto);

    if (updatedData.username || updatedData.email) {
      await this.ensureUserIsUnique(updatedData, id);
    }

    if (updatedData.password) {
      updatedData.password = await this.hashPassword(updatedData.password);
    }

    const updated = this.userRepository.merge(user, updatedData);

    try {
      const savedUser = await this.userRepository.save(updated);
      return this.buildUserRO(savedUser);
    } catch (error) {
      this.throwConflictOnUniqueViolation(error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    await this.findEntityById(id);
    await this.userRepository.delete(id);
    this.logger.log(`User #${id} deleted`);
  }

  generateJWT(user: UserEntity): string {
    return this.jwtService.sign({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  }

  buildUserRO(user: UserEntity): UserRO {
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

  private normalizeUpdateDto(dto: UpdateUserDto): Partial<UserEntity> {
    return {
      ...dto,
      ...(dto.username
        ? { username: this.normalizeUsername(dto.username) }
        : {}),
      ...(dto.email ? { email: this.normalizeEmail(dto.email) } : {}),
    };
  }

  private normalizeUsername(username: string): string {
    return username.trim();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async ensureUserIsUnique(
    { username, email }: Pick<UpdateUserDto, "username" | "email">,
    currentUserId?: number,
  ): Promise<void> {
    const where = [
      username
        ? { username, ...(currentUserId ? { id: Not(currentUserId) } : {}) }
        : null,
      email
        ? { email, ...(currentUserId ? { id: Not(currentUserId) } : {}) }
        : null,
    ].filter(Boolean);

    if (where.length === 0) {
      return;
    }

    const existingUser = await this.userRepository.findOne({ where });

    if (existingUser) {
      throw new ConflictException(this.duplicateMessage);
    }
  }

  private throwConflictOnUniqueViolation(error: unknown): void {
    if (this.isUniqueViolation(error)) {
      throw new ConflictException(this.duplicateMessage);
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    );
  }
}
