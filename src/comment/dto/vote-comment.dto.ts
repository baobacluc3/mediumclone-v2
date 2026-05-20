import { IsIn } from "class-validator";

export class VoteCommentDto {
  @IsIn([1, -1])
  value: 1 | -1;
}
