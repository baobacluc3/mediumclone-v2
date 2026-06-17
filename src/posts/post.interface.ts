import { PostEntity } from "./post.entity";

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
