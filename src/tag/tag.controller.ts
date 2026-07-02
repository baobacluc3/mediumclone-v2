import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { ParsePositiveIntPipe } from "../common/pipes/parse-positive-int.pipe";
import { Permission } from "@/auth/permissions";
import { Public } from "@/common/decorators/public.decorator";
import { RequirePermissions } from "@/common/decorators/permissions.decorator";
import {
  CreateTagDto,
  TagsDto,
  TagResponseDto,
  UpdateTagDto,
} from "./dto/tag.dto";
import { TagService } from "./tag.service";

@Controller("tags")
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Public()
  @Get()
  findAll(): Promise<TagsDto> {
    return this.tagService.findAll();
  }

  @Public()
  @Get(":id")
  findOne(
    @Param("id", ParsePositiveIntPipe) id: number,
  ): Promise<TagResponseDto> {
    return this.tagService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.MANAGE_TAGS)
  create(@Body() createTagDto: CreateTagDto): Promise<TagResponseDto> {
    return this.tagService.create(createTagDto);
  }

  @Put(":id")
  @RequirePermissions(Permission.MANAGE_TAGS)
  update(
    @Param("id", ParsePositiveIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    return this.tagService.update(id, updateTagDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.MANAGE_TAGS)
  remove(@Param("id", ParsePositiveIntPipe) id: number): Promise<void> {
    return this.tagService.remove(id);
  }
}
