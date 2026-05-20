import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Comment } from "../post/comment.entity";
import { PostEntity } from "../post/post.entity";
import { UserEntity } from "../user/user.entity";
import { CreateCommentDto } from "../post/dto";
import { CommentsRO } from "../post/post.interface";

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findComments(slug: string): Promise<CommentsRO> {
    const post = await this.postRepository.findOne({ where: { slug } });
    if (!post) throw new NotFoundException("Post not found");

    return { comments: post.comments };
  }

  async createComment(
    slug: string,
    userId: number,
    dto: CreateCommentDto,
  ): Promise<CommentsRO> {
    const post = await this.postRepository.findOne({ where: { slug } });
    if (!post) throw new NotFoundException("Post not found");

    const author = await this.userRepository.findOneBy({ id: userId });
    if (!author) throw new NotFoundException("User not found");

    const comment = this.commentRepository.create({
      body: dto.body,
      post,
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
    const post = await this.postRepository.findOne({ where: { slug } });
    if (!post) throw new NotFoundException("Post not found");

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
