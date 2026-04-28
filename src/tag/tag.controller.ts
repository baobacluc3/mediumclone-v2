import {
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Controller,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";

import { TagEntity } from "./tag.entity";
import { TagService } from "./tag.service";
import {
  CreateTagDto,
  UpdateTagDto,
  PaginationQueryDto,
  PaginatedTagsDto,
  TagResponseDto,
} from "./tag.dto";

@ApiBearerAuth()
@ApiTags("tags")
@Controller("tags")
export class TagController {
  constructor(private readonly tagService: TagService) {}

  // ─── GET /tags ───────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: "Get all tags with pagination and search" })
  @ApiResponse({ status: 200, type: PaginatedTagsDto })
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedTagsDto> {
    return this.tagService.findAll(query);
  }

  // ─── GET /tags/:id ───────────────────────────────────────────────────────────
  @Get(":id")
  @ApiOperation({ summary: "Get a single tag by ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, type: TagResponseDto })
  @ApiResponse({ status: 404, description: "Tag not found" })
  findOne(@Param("id", ParseIntPipe) id: number): Promise<TagEntity> {
    return this.tagService.findOne(id);
  }

  // ─── POST /tags ──────────────────────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new tag" })
  @ApiResponse({ status: 201, type: TagResponseDto })
  @ApiResponse({ status: 409, description: "Tag name already exists" })
  create(@Body() createTagDto: CreateTagDto): Promise<TagEntity> {
    return this.tagService.create(createTagDto);
  }

  // ─── PUT /tags/:id ───────────────────────────────────────────────────────────
  @Put(":id")
  @ApiOperation({ summary: "Update an existing tag" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, type: TagResponseDto })
  @ApiResponse({ status: 404, description: "Tag not found" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<TagEntity> {
    return this.tagService.update(id, updateTagDto);
  }

  // ─── DELETE /tags/:id ────────────────────────────────────────────────────────
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Soft-delete a tag by ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 204, description: "Tag deleted successfully" })
  @ApiResponse({ status: 404, description: "Tag not found" })
  remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.tagService.remove(id);
  }
}
