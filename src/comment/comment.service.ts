import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PostEntity } from "../posts/post.entity";
import { UserEntity } from "../user/user.entity";
import { CreateCommentDto } from "../posts/dto";
import { CommentsRO } from "../posts/post.interface";
import { CommentEntity } from "./comment.entity";
import { AuthUser } from "@/auth/types/auth-user.type";
import { CommentPolicy } from "./policies/comment.policy";

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly commentPolicy: CommentPolicy,
  ) {}

  async findComments(slug: string): Promise<CommentsRO> {
    const post = await this.postRepository.findOne({ where: { slug } });
    if (!post) throw new NotFoundException("Post not found");

    const comments = await this.commentRepository.find({
      where: { postId: post.id },
      relations: ["author"],
      order: { createdAt: "ASC" },
    });

    return { comments };
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
    user: AuthUser,
  ): Promise<CommentsRO> {
    const post = await this.postRepository.findOne({ where: { slug } });
    if (!post) throw new NotFoundException("Post not found");

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ["author"],
    });

    if (!comment) throw new NotFoundException("Comment not found");
    if (!this.commentPolicy.canDelete(user, comment)) {
      throw new ForbiddenException("You can only delete your own comments");
    }

    await this.commentRepository.delete(commentId);

    return this.findComments(slug);
  }
}
