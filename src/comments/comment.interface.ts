import { PostAuthor } from "../posts/post.interface";

/** Public-facing comment shape; author is trimmed to public fields. */
export interface CommentResponse {
  id: number;
  body: string;
  createdAt: Date;
  author: PostAuthor;
}

export interface CommentRO {
  comment: CommentResponse;
}

export interface CommentsRO {
  comments: CommentResponse[];
}
