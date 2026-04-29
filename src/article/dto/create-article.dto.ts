import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateArticleDto {
  @ApiProperty({ example: "How to build a NestJS API" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  readonly title: string;

  @ApiProperty({ example: "A short description of the article" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  readonly description: string;

  @ApiProperty({ example: "Full article content goes here..." })
  @IsNotEmpty()
  @IsString()
  readonly body: string;

  @ApiPropertyOptional({ example: ["nestjs", "typescript"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  readonly tagList: string[] = [];
}
