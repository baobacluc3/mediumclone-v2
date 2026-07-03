import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AuthenticatedUser } from "@/auth/auth.types";
import { CaslAbilityFactory } from "@/authorization/abilities/casl-ability.factory";
import { Action } from "@/authorization/domain/action.enum";
import { PostEntity } from "../posts/post.entity";
import { CommentEntity } from "./comment.entity";
import { CommentResponse, CommentRO, CommentsRO } from "./comment.interface";
import { CreateCommentDto, FindCommentsQueryDto } from "./dto";

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    private readonly abilityFactory: CaslAbilityFactory,
  ) {}

  async findByPost(
    slug: string,
    query: FindCommentsQueryDto,
  ): Promise<CommentsRO> {
    const post = await this.findPostOrFail(slug);

    // `id` breaks ties between comments created in the same millisecond so
    // rows can't reshuffle between pages.
    const [comments, commentsCount] = await this.commentRepository.findAndCount(
      {
        where: { postId: post.id },
        relations: ["author"],
        order: { createdAt: "DESC", id: "DESC" },
        skip: query.offset,
        take: query.limit,
      },
    );

    return {
      comments: comments.map((comment) => this.toResponse(comment)),
      commentsCount,
    };
  }

  async create(
    userId: number,
    slug: string,
    dto: CreateCommentDto,
  ): Promise<CommentRO> {
    const post = await this.findPostOrFail(slug);

    const saved = await this.commentRepository.save(
      this.commentRepository.create({
        body: dto.body,
        postId: post.id,
        authorId: userId,
      }),
    );

    // Reload with the author relation so the response carries public
    // author fields without trusting whatever is on the request.
    const comment = await this.commentRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ["author"],
    });

    return { comment: this.toResponse(comment) };
  }

  async delete(
    user: AuthenticatedUser,
    slug: string,
    commentId: number,
  ): Promise<void> {
    const post = await this.findPostOrFail(slug);

    const comment = await this.commentRepository.findOne({
      where: { id: commentId, postId: post.id },
    });

    if (!comment) throw new NotFoundException("Comment not found");

    const ability = await this.abilityFactory.createForUser(user);
    if (ability.cannot(Action.Delete, comment)) {
      throw new ForbiddenException("You can only delete your own comments");
    }

    await this.commentRepository.delete(comment.id);
  }

  private async findPostOrFail(slug: string): Promise<PostEntity> {
    const post = await this.postRepository.findOne({ where: { slug } });
    if (!post) throw new NotFoundException("Post not found");
    return post;
  }

  private toResponse(comment: CommentEntity): CommentResponse {
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
      },
    };
  }
}
