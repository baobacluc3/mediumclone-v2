import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;

  @IsOptional()
  @IsString()
  readonly body?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  readonly tagList?: string[];
}
