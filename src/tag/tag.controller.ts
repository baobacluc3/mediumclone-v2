import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  CreateTagDto,
  PaginatedTagsDto,
  PaginationQueryDto,
  TagResponseDto,
  UpdateTagDto,
} from "./tag.dto";
import { TagEntity } from "./tag.entity";
import { TagService } from "./tag.service";

@ApiBearerAuth()
@ApiTags("tags")
@Controller("tags")
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  @ApiOperation({ summary: "Get all tags with pagination and search" })
  @ApiResponse({ status: 200, type: PaginatedTagsDto })
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedTagsDto> {
    return this.tagService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single tag by ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, type: TagResponseDto })
  @ApiResponse({ status: 404, description: "Tag not found" })
  findOne(@Param("id", ParseIntPipe) id: number): Promise<TagEntity> {
    return this.tagService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new tag" })
  @ApiResponse({ status: 201, type: TagResponseDto })
  @ApiResponse({ status: 409, description: "Tag name already exists" })
  create(@Body() createTagDto: CreateTagDto): Promise<TagEntity> {
    return this.tagService.create(createTagDto);
  }

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
