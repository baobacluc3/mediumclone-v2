import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Comment } from "../article/comment.entity";
import { ArticleEntity } from "../article/article.entity";
import { UserEntity } from "../user/user.entity";
import { CreateCommentDto } from "../article/dto";
import { CommentsRO } from "../article/article.interface";

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findComments(slug: string): Promise<CommentsRO> {
    const article = await this.articleRepository.findOne({ where: { slug } });
    if (!article) throw new NotFoundException("Article not found");

    return { comments: article.comments };
  }

  async createComment(
    slug: string,
    userId: number,
    dto: CreateCommentDto,
  ): Promise<CommentsRO> {
    const article = await this.articleRepository.findOne({ where: { slug } });
    if (!article) throw new NotFoundException("Article not found");

    const author = await this.userRepository.findOneBy({ id: userId });
    if (!author) throw new NotFoundException("User not found");

    const comment = this.commentRepository.create({
      body: dto.body,
      article,
      author,
    });

    await this.commentRepository.save(comment);

    return this.findComments(slug);
  }

  async deleteComment(
    slug: string,
    commentId: number,
    userId: number,
  ): Promise<CommentsRO> {
    const article = await this.articleRepository.findOne({ where: { slug } });
    if (!article) throw new NotFoundException("Article not found");

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ["author"],
    });

    if (!comment) throw new NotFoundException("Comment not found");
    if (comment.author?.id !== userId) {
      throw new ForbiddenException("You can only delete your own comments");
    }

    await this.commentRepository.delete(commentId);

    return this.findComments(slug);
  }
}
