import { ArticleEntity } from "./article.entity";
import { Comment } from "./comment.entity";

export type ArticleResponse = Omit<ArticleEntity, "tags"> & {
  tagList: string[];
};

export interface ArticleRO {
  article: ArticleResponse;
}

export interface ArticlesRO {
  articles: ArticleResponse[];
  articlesCount: number;
}

export interface CommentsRO {
  comments: Comment[];
}
