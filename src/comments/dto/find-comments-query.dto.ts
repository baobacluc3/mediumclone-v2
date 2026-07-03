import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

/**
 * Pagination for a post's comment list. `limit` is capped so a client can
 * never ask the database for an unbounded result set.
 */
export class FindCommentsQueryDto {
  /** Page size, 1..100. Defaults to 20. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly limit: number = 20;

  /** Rows to skip. Defaults to 0. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly offset: number = 0;
}
