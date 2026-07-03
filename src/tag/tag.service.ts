import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  CreateTagDto,
  TagsDto,
  TagResponseDto,
  UpdateTagDto,
} from "./dto/tag.dto";
import { TagEntity } from "./tag.entity";

@Injectable()
export class TagService {
  private readonly logger = new Logger(TagService.name);

  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>,
  ) {}

  async findAll(): Promise<TagsDto> {
    const [data, total] = await this.tagRepository.findAndCount({
      order: { createdAt: "DESC" },
    });

    this.logger.log(`Found ${total} tags`);

    return {
      data: data.map((tag) => this.toTagResponse(tag)),
      total,
    };
  }

  async findOne(id: number): Promise<TagResponseDto> {
    return this.toTagResponse(await this.findEntityOrFail(id));
  }

  async create(createTagDto: CreateTagDto): Promise<TagResponseDto> {
    await this.assertNameIsUnique(createTagDto.name);

    const tag = this.tagRepository.create(createTagDto);
    const saved = await this.tagRepository.save(tag);

    this.logger.log(`Created tag: ${saved.name} (id: ${saved.id})`);

    return this.toTagResponse(saved);
  }

  async update(
    id: number,
    updateTagDto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    const tag = await this.findEntityOrFail(id);

    if (updateTagDto.name && updateTagDto.name !== tag.name) {
      await this.assertNameIsUnique(updateTagDto.name);
    }

    const updated = await this.tagRepository.save({ ...tag, ...updateTagDto });

    this.logger.log(`Updated tag id: ${id}`);

    return this.toTagResponse(updated);
  }

  async remove(id: number): Promise<void> {
    const tag = await this.findEntityOrFail(id);
    await this.tagRepository.softRemove(tag);

    this.logger.log(`Soft deleted tag id: ${id}`);
  }

  private async assertNameIsUnique(name: string): Promise<void> {
    const existing = await this.tagRepository.findOne({ where: { name } });

    if (existing) {
      throw new ConflictException(`Tag with name "${name}" already exists`);
    }
  }

  private async findEntityOrFail(id: number): Promise<TagEntity> {
    const tag = await this.tagRepository.findOne({ where: { id } });

    if (!tag) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }

    return tag;
  }

  private toTagResponse(tag: TagEntity): TagResponseDto {
    return {
      id: tag.id,
      name: tag.name,
      description: tag.description,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }
}
