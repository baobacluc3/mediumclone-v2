import { ArticleEntity } from "./entities/article.entity";
import { Comment } from "./entities/comment.entity";

export interface ArticleRO {
  article: ArticleEntity;
}

export interface ArticlesRO {
  articles: ArticleEntity[];
  articlesCount: number;
}

export interface CommentsRO {
  comments: Comment[];
}
