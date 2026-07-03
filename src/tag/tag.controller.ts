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
import { Public } from "@/authorization/decorators/public.decorator";
import { RequirePermissions } from "@/authorization/decorators/require-permissions.decorator";
import { Action } from "@/authorization/domain/action.enum";
import { AppSubject } from "@/authorization/domain/app-subject.enum";
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

  @Get()
  @Public()
  findAll(): Promise<TagsDto> {
    return this.tagService.findAll();
  }

  @Get(":id")
  @Public()
  findOne(
    @Param("id", ParsePositiveIntPipe) id: number,
  ): Promise<TagResponseDto> {
    return this.tagService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions({ action: Action.Manage, subject: AppSubject.Tag })
  create(@Body() createTagDto: CreateTagDto): Promise<TagResponseDto> {
    return this.tagService.create(createTagDto);
  }

  @Put(":id")
  @RequirePermissions({ action: Action.Manage, subject: AppSubject.Tag })
  update(
    @Param("id", ParsePositiveIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    return this.tagService.update(id, updateTagDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions({ action: Action.Manage, subject: AppSubject.Tag })
  remove(@Param("id", ParsePositiveIntPipe) id: number): Promise<void> {
    return this.tagService.remove(id);
  }
}
