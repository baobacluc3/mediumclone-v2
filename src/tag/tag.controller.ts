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
  Query,
  UseGuards,
} from "@nestjs/common";
import { ParsePositiveIntPipe } from "../common/pipes/parse-positive-int.pipe";
import { AccessControlGuard } from "@/auth/authorization/access-control.guard";
import { Permission } from "@/auth/permissions";
import { RequirePermissions } from "@/common/decorators/permissions.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import {
  CreateTagDto,
  PaginatedTagsDto,
  PaginationQueryDto,
  UpdateTagDto,
} from "./dto/tag.dto";
import { TagEntity } from "./tag.entity";
import { TagService } from "./tag.service";

@Controller("tags")
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedTagsDto> {
    return this.tagService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParsePositiveIntPipe) id: number): Promise<TagEntity> {
    return this.tagService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, AccessControlGuard)
  @RequirePermissions(Permission.MANAGE_TAGS)
  create(@Body() createTagDto: CreateTagDto): Promise<TagEntity> {
    return this.tagService.create(createTagDto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, AccessControlGuard)
  @RequirePermissions(Permission.MANAGE_TAGS)
  update(
    @Param("id", ParsePositiveIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<TagEntity> {
    return this.tagService.update(id, updateTagDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AccessControlGuard)
  @RequirePermissions(Permission.MANAGE_TAGS)
  remove(@Param("id", ParsePositiveIntPipe) id: number): Promise<void> {
    return this.tagService.remove(id);
  }
}
