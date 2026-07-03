/** Shapes returned by the backend API (already unwrapped from the standard
 * `{ success, data, ... }` envelope by the client). */

export interface Author {
  id: number;
  username: string;
  bio: string;
  image: string;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  favoriteCount: number;
  favorited: boolean;
  createdAt: string;
  updatedAt: string;
  author: Author;
}

export interface ArticlesResponse {
  posts: Article[];
  postsCount: number;
}

export interface Comment {
  id: number;
  body: string;
  createdAt: string;
  author: Author;
}

export interface CommentsResponse {
  comments: Comment[];
  commentsCount: number;
}

export interface Profile {
  username: string;
  bio: string;
  image?: string;
  following?: boolean;
}

export interface CurrentUser {
  username: string;
  email: string;
  emailVerified: boolean;
  bio: string;
  image: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type ArticleSortField =
  | "createdAt"
  | "updatedAt"
  | "favoriteCount"
  | "title";

export interface ArticleQuery {
  tag?: string;
  author?: string;
  favorited?: string;
  search?: string;
  sortBy?: ArticleSortField;
  sortDir?: "asc" | "desc";
  limit?: number;
  offset?: number;
}
