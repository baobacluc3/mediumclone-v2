import { PostEntity } from "./post.entity";

/** Public-facing subset of a post's author. Excludes email, roles, and any
 * other account fields that shouldn't be visible to arbitrary readers. */
export interface PostAuthor {
  id: number;
  username: string;
  bio: string;
  image: string;
}

export type PostResponse = Omit<PostEntity, "tags" | "author"> & {
  tagList: string[];
  author: PostAuthor;
  /** Whether the authenticated caller has favorited this post. Always false
   * for anonymous requests. */
  favorited: boolean;
};

export interface PostRO {
  post: PostResponse;
}

export interface PostsRO {
  posts: PostResponse[];
  postsCount: number;
}
