import { PostEntity } from "./post.entity";
import { Comment } from "./comment.entity";

export type PostResponse = Omit<PostEntity, "tags"> & {
  tagList: string[];
};

export interface PostRO {
  post: PostResponse;
}

export interface PostsRO {
  posts: PostResponse[];
  postsCount: number;
}

export interface CommentsRO {
  comments: Comment[];
}
