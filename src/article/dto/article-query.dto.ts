import { IsOptional, IsString, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class ArticleQueryDto {
  @ApiPropertyOptional({ example: "nestjs" })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ example: "john_doe" })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ example: "jane_doe" })
  @IsOptional()
  @IsString()
  favorited?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}
