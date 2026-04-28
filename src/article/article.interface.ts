import { ArticleEntity } from "./article.entity";
import { Comment } from "./comment.entity";

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
