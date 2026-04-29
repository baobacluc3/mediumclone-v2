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
    private readonly jwtService: JwtService,
  ) {}

  async findOne({ email, password }: LoginUserDto): Promise<UserEntity | null> {
    const foundUser = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password") //required if the column has select: false
      .where("user.email = :email", { email })
      .getOne();

    if (!foundUser) throw new UnauthorizedException("user not found");

    const isMatching = await this.validatePassword(
      foundUser.password,
      password,
    );
    if (!isMatching) throw new UnauthorizedException("invalid");
    return foundUser;
  }

  private async validatePassword(
    plain: string,
    hashed: string,
  ): Promise<boolean> {
    return await argon2.verify(hashed, plain);
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
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException(`User with email "${email}" not found`);
    }

    return this.buildUserRO(user);
  }

  async create({ username, email, password }: CreateUserDto): Promise<UserRO> {
    const exists = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (exists) {
      throw new ConflictException("Username or email is already taken.");
    }

    const newUser = this.userRepository.create({
      username,
      email,
      password: await this.hashPassword(password),
    });

    const savedUser = await this.userRepository.save(newUser);
    this.logger.log(`User created: ${savedUser.email}`);
    return this.buildUserRO(savedUser);
  }

  private async hashPassword(plain: string): Promise<string> {
    return await argon2.hash(plain);
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserRO> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    const updatedData = { ...dto };

    if (updatedData.password) {
      updatedData.password = await this.hashPassword(updatedData.password);
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
    return this.jwtService.sign({
      id: user.id,
      username: user.username,
      email: user.email,
    });
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
