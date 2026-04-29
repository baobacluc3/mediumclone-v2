import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TagController } from "./tag.controller";
import { CreateTagDto, PaginationQueryDto, UpdateTagDto } from "./tag.dto";
import { TagEntity } from "./tag.entity";
import { TagService } from "./tag.service";

const makeTag = (partial: Partial<TagEntity> = {}): TagEntity => {
  const tag = new TagEntity();
  tag.id = 1;
  tag.name = "nestjs";
  tag.description = "NestJS related articles";
  tag.createdAt = new Date();
  tag.updatedAt = new Date();
  return Object.assign(tag, partial);
};

const mockRepository = () => ({
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
});

describe("TagService", () => {
  let service: TagService;
  let repo: jest.Mocked<Repository<TagEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        { provide: getRepositoryToken(TagEntity), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
    repo = module.get(getRepositoryToken(TagEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe("findAll", () => {
    it("should return paginated tags", async () => {
      const tags = [makeTag({ id: 1 }), makeTag({ id: 2, name: "reactjs" })];
      repo.findAndCount.mockResolvedValue([tags, 2]);

      const query: PaginationQueryDto = { page: 1, limit: 10 };
      const result = await service.findAll(query);

      expect(result).toEqual({ data: tags, total: 2, page: 1, lastPage: 1 });
      expect(repo.findAndCount).toHaveBeenCalledTimes(1);
    });

    it("should return empty data when no tags exist", async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should calculate lastPage correctly", async () => {
      const tags = Array.from({ length: 5 }, (_, i) =>
        makeTag({ id: i + 1, name: `tag${i + 1}` }),
      );
      repo.findAndCount.mockResolvedValue([tags, 23]);

      const result = await service.findAll({ page: 2, limit: 5 });
      expect(result.lastPage).toBe(5);
    });
  });

  describe("findOne", () => {
    it("should return a tag by id", async () => {
      const tag = makeTag();
      repo.findOne.mockResolvedValue(tag);

      const result = await service.findOne(1);
      expect(result).toEqual(tag);
    });

    it("should throw NotFoundException when tag does not exist", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create and return a new tag", async () => {
      const dto: CreateTagDto = { name: "nestjs", description: "NestJS stuff" };
      const tag = makeTag(dto);

      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(tag);
      repo.save.mockResolvedValue(tag);

      const result = await service.create(dto);
      expect(result).toEqual(tag);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it("should throw ConflictException if tag name already exists", async () => {
      repo.findOne.mockResolvedValue(makeTag());

      await expect(service.create({ name: "nestjs" })).rejects.toThrow(
        ConflictException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update and return the tag", async () => {
      const existing = makeTag();
      const dto: UpdateTagDto = { name: "nestjs-v2" };
      const updated = makeTag({ ...dto });

      repo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(null);
      repo.save.mockResolvedValue(updated);

      const result = await service.update(1, dto);
      expect(result.name).toBe("nestjs-v2");
    });

    it("should throw NotFoundException if tag does not exist", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update(99, { name: "x" })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("remove", () => {
    it("should soft-delete the tag", async () => {
      const tag = makeTag();
      repo.findOne.mockResolvedValue(tag);
      repo.softRemove.mockResolvedValue(tag);

      await service.remove(1);
      expect(repo.softRemove).toHaveBeenCalledWith(tag);
    });

    it("should throw NotFoundException when deleting a non-existent tag", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});

describe("TagController", () => {
  let controller: TagController;
  let service: jest.Mocked<TagService>;

  const mockTagService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagController],
      providers: [{ provide: TagService, useValue: mockTagService }],
    }).compile();

    controller = module.get<TagController>(TagController);
    service = module.get(TagService);
  });

  afterEach(() => jest.clearAllMocks());

  it("findAll â€” delegates to service with query", async () => {
    const query: PaginationQueryDto = { page: 1, limit: 10 };
    const payload = { data: [], total: 0, page: 1, lastPage: 0 };
    service.findAll.mockResolvedValue(payload);

    const result = await controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(payload);
  });

  it("findOne â€” delegates to service with parsed id", async () => {
    const tag = makeTag();
    service.findOne.mockResolvedValue(tag);

    const result = await controller.findOne(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toBe(tag);
  });

  it("create â€” delegates to service with dto", async () => {
    const dto: CreateTagDto = { name: "nestjs" };
    const tag = makeTag();
    service.create.mockResolvedValue(tag);

    const result = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(tag);
  });

  it("update â€” delegates to service with id and dto", async () => {
    const dto: UpdateTagDto = { name: "nestjs-v2" };
    const tag = makeTag({ name: "nestjs-v2" });
    service.update.mockResolvedValue(tag);

    const result = await controller.update(1, dto);
    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toBe(tag);
  });

  it("remove â€” delegates to service", async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
