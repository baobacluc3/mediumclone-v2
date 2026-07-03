import { Transform, Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

/**
 * Sortable columns for the article listing. The service maps these enum
 * values to column names, so user input can never name an arbitrary column.
 */
export enum PostSortField {
  CreatedAt = "createdAt",
  UpdatedAt = "updatedAt",
  FavoriteCount = "favoriteCount",
  Title = "title",
}

export enum SortDirection {
  Asc = "ASC",
  Desc = "DESC",
}

/**
 * Query parameters for the article listing. Mirrors the RealWorld/Medium spec:
 * keyset-free offset pagination plus optional `tag` / `author` / `favorited`
 * filters, a free-text `search`, and whitelisted sorting. `limit` is capped so
 * a client can never ask the database for an unbounded result set.
 */
export class FindPostsQueryDto {
  /** Only posts carrying this tag name. */
  @IsOptional()
  @IsString()
  readonly tag?: string;

  /** Only posts authored by this username. */
  @IsOptional()
  @IsString()
  readonly author?: string;

  /** Only posts favorited by this username. */
  @IsOptional()
  @IsString()
  readonly favorited?: string;

  /** Case-insensitive text match against title and description. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly search?: string;

  /** Column to sort by. Defaults to newest first. */
  @IsOptional()
  @IsEnum(PostSortField)
  readonly sortBy: PostSortField = PostSortField.CreatedAt;

  /** Sort direction; accepts `asc`/`desc` in any casing. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.toUpperCase() : value,
  )
  @IsEnum(SortDirection)
  readonly sortDir: SortDirection = SortDirection.Desc;

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
