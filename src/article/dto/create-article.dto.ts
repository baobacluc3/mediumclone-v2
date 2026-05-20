import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  readonly title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  readonly description: string;

  @IsNotEmpty()
  @IsString()
  readonly body: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  readonly tagList: string[] = [];
}
