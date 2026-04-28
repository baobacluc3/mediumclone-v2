import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";

import { TagEntity } from "./tag.entity";
import {
  CreateTagDto,
  UpdateTagDto,
  PaginationQueryDto,
  PaginatedTagsDto,
} from "./tag.dto";

@Injectable()
export class TagService {
  private readonly logger = new Logger(TagService.name);

  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedTagsDto> {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where = search ? { name: ILike(`%${search}%`) } : {};

    const [data, total] = await this.tagRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });

    this.logger.log(`Found ${total} tags (page ${page})`);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<TagEntity> {
    const tag = await this.tagRepository.findOne({ where: { id } });

    if (!tag) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }

    return tag;
  }

  async create(createTagDto: CreateTagDto): Promise<TagEntity> {
    await this.assertNameIsUnique(createTagDto.name);

    const tag = this.tagRepository.create(createTagDto);
    const saved = await this.tagRepository.save(tag);

    this.logger.log(`Created tag: ${saved.name} (id: ${saved.id})`);
    return saved;
  }

  async update(id: number, updateTagDto: UpdateTagDto): Promise<TagEntity> {
    const tag = await this.findOne(id);

    if (updateTagDto.name && updateTagDto.name !== tag.name) {
      await this.assertNameIsUnique(updateTagDto.name);
    }

    const updated = await this.tagRepository.save({ ...tag, ...updateTagDto });

    this.logger.log(`Updated tag id: ${id}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const tag = await this.findOne(id);
    await this.tagRepository.softRemove(tag);

    this.logger.log(`Soft deleted tag id: ${id}`);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async assertNameIsUnique(name: string): Promise<void> {
    const existing = await this.tagRepository.findOne({ where: { name } });
    if (existing) {
      throw new ConflictException(`Tag with name "${name}" already exists`);
    }
  }
}
