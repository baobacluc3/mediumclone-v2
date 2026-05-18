import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { Repository } from "typeorm";

jest.mock("argon2", () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

jest.mock("../../article/entities/article.entity", () => ({
  ArticleEntity: class ArticleEntity {},
}));

import { CreateUserDto, LoginUserDto, UpdateUserDto } from "../dto";
import { UserEntity } from "../entities/user.entity";
import { UserService } from "./user.service";

const makeUser = (partial: Partial<UserEntity> = {}): UserEntity => {
  const user = new UserEntity();
  user.id = 1;
  user.username = "johndoe";
  user.email = "john@example.com";
  user.bio = "";
  user.image = "";
  user.password = "hashed-password";
  user.createdAt = new Date();
  user.updatedAt = new Date();
  user.favorites = [];
  user.articles = [];
  return Object.assign(user, partial);
};

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(),
  delete: jest.fn(),
});

describe("UserService", () => {
  let service: UserService;
  let repo: jest.Mocked<Repository<UserEntity>>;
  let configService: { getOrThrow: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let queryBuilder: {
    addSelect: jest.Mock;
    where: jest.Mock;
    getOne: jest.Mock;
  };

  beforeEach(async () => {
    configService = {
      getOrThrow: jest.fn().mockReturnValue("test-secret"),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue("signed-token"),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: ConfigService, useValue: configService },
        { provide: JwtService, useValue: jwtService },
        { provide: getRepositoryToken(UserEntity), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get(getRepositoryToken(UserEntity));
    queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    repo.createQueryBuilder.mockReturnValue(queryBuilder as never);
    repo.merge.mockImplementation(
      (entity: UserEntity, data: Partial<UserEntity>) =>
        Object.assign(entity, data),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("hashes the password, persists the user, and returns a user response", async () => {
      const dto: CreateUserDto = {
        username: "johndoe",
        email: "john@example.com",
        password: "plain-password",
      };
      const savedUser = makeUser();

      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(savedUser);
      repo.save.mockResolvedValue(savedUser);
      (
        argon2.hash as jest.MockedFunction<typeof argon2.hash>
      ).mockResolvedValue("hashed-password");

      const result = await service.create(dto);

      expect(argon2.hash).toHaveBeenCalledWith(dto.password);
      expect(repo.create).toHaveBeenCalledWith({
        username: dto.username,
        email: dto.email,
        password: "hashed-password",
      });
      expect(repo.save).toHaveBeenCalledWith(savedUser);
      expect(result.user).toEqual(
        expect.objectContaining({
          username: savedUser.username,
          email: savedUser.email,
          bio: savedUser.bio,
          image: savedUser.image,
          token: expect.any(String),
        }),
      );
    });

    it("normalizes username and email before creating", async () => {
      const dto: CreateUserDto = {
        username: "  johndoe  ",
        email: "  JOHN@EXAMPLE.COM  ",
        password: "plain-password",
      };
      const savedUser = makeUser();

      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(savedUser);
      repo.save.mockResolvedValue(savedUser);
      (
        argon2.hash as jest.MockedFunction<typeof argon2.hash>
      ).mockResolvedValue("hashed-password");

      await service.create(dto);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: [{ username: "johndoe" }, { email: "john@example.com" }],
      });
      expect(repo.create).toHaveBeenCalledWith({
        username: "johndoe",
        email: "john@example.com",
        password: "hashed-password",
      });
    });

    it("throws a conflict exception when username or email already exists", async () => {
      repo.findOne.mockResolvedValue(makeUser());

      await expect(
        service.create({
          username: "johndoe",
          email: "john@example.com",
          password: "plain-password",
        }),
      ).rejects.toThrow(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("returns the user when credentials are valid", async () => {
      const dto: LoginUserDto = {
        email: "john@example.com",
        password: "plain-password",
      };
      const user = makeUser();

      queryBuilder.getOne.mockResolvedValue(user);
      (
        argon2.verify as jest.MockedFunction<typeof argon2.verify>
      ).mockResolvedValue(true);

      const result = await service.findOne(dto);

      expect(repo.createQueryBuilder).toHaveBeenCalledWith("user");
      expect(queryBuilder.addSelect).toHaveBeenCalledWith("user.password");
      expect(queryBuilder.where).toHaveBeenCalledWith(
        "LOWER(user.email) = :email",
        {
          email: dto.email,
        },
      );
      expect(argon2.verify).toHaveBeenCalledWith(user.password, dto.password);
      expect(result).toBe(user);
    });

    it("throws unauthorized when the password is invalid", async () => {
      queryBuilder.getOne.mockResolvedValue(makeUser());
      (
        argon2.verify as jest.MockedFunction<typeof argon2.verify>
      ).mockResolvedValue(false);

      await expect(
        service.findOne({
          email: "john@example.com",
          password: "wrong-password",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("normalizes login email before lookup", async () => {
      const user = makeUser();
      queryBuilder.getOne.mockResolvedValue(user);
      (
        argon2.verify as jest.MockedFunction<typeof argon2.verify>
      ).mockResolvedValue(true);

      await service.findOne({
        email: "  JOHN@EXAMPLE.COM  ",
        password: "plain-password",
      });

      expect(queryBuilder.where).toHaveBeenCalledWith(
        "LOWER(user.email) = :email",
        {
          email: "john@example.com",
        },
      );
    });

    it("throws unauthorized when the email is unknown", async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.findOne({
          email: "missing@example.com",
          password: "plain-password",
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(argon2.verify).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("hashes a new password and saves the merged user", async () => {
      const existingUser = makeUser();
      const dto: UpdateUserDto = {
        bio: "Updated bio",
        password: "new-password",
      };
      const savedUser = makeUser({
        bio: "Updated bio",
        password: "rehashed-password",
      });

      repo.findOne.mockResolvedValue(existingUser);
      repo.save.mockResolvedValue(savedUser);
      (
        argon2.hash as jest.MockedFunction<typeof argon2.hash>
      ).mockResolvedValue("rehashed-password");

      const result = await service.update(1, dto);

      expect(argon2.hash).toHaveBeenCalledWith(dto.password);
      expect(repo.merge).toHaveBeenCalledWith(existingUser, {
        bio: "Updated bio",
        password: "rehashed-password",
      });
      expect(repo.save).toHaveBeenCalledWith(existingUser);
      expect(result.user).toEqual(
        expect.objectContaining({
          username: savedUser.username,
          email: savedUser.email,
          bio: "Updated bio",
          image: savedUser.image,
          token: expect.any(String),
        }),
      );
    });

    it("throws a conflict exception when updating to a taken username or email", async () => {
      repo.findOne
        .mockResolvedValueOnce(makeUser())
        .mockResolvedValueOnce(makeUser({ id: 2, username: "taken" }));

      await expect(service.update(1, { username: "taken" })).rejects.toThrow(
        ConflictException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it("throws not found when updating a missing user", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update(404, { bio: "Missing" })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
