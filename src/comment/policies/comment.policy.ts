import { Injectable } from "@nestjs/common";
import { CommentEntity, CommentStatus } from "../comment.entity";
import { AuthUser, UserRole } from "@/auth/types/auth-user.type";

@Injectable()
export class CommentPolicy {
  canEdit(userId: number, comment: CommentEntity): boolean {
    return (
      comment.authorId === userId && comment.status === CommentStatus.ACTIVE
    );
  }

  canDelete(user: AuthUser, comment: CommentEntity): boolean {
    return (
      comment.authorId === user.id ||
      user.roles.includes(UserRole.MODERATOR) ||
      user.roles.includes(UserRole.ADMIN)
    );
  }

  //Nếu parent.depth < 5, nghĩa là chỉ cho  cay reply đến một mức nhất định để tránh comment lồng quá sâu.
  canReply(user: AuthUser, parent: CommentEntity): boolean {
    return parent.status !== CommentStatus.REMOVED && parent.depth < 5;
  }

  canVote(user: AuthUser, comment: CommentEntity): boolean {
    return (
      comment.authorId !== user.id && comment.status === CommentStatus.ACTIVE
    );
  }
}
