import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCommentDto {
  @ApiProperty({ example: "Great article!" })
  @IsNotEmpty()
  @IsString()
  readonly body: string;
}
