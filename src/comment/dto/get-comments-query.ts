import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class GetCommentsQueryDto {
  @IsOptional()
  @IsIn(["new", "top", "controversial"])
  sort?: "new" | "top" | "controversial" = "top";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cursor?: string;
}
