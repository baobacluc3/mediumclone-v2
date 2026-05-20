import { PostEntity } from "@/posts/post.entity";
import { UserEntity } from "@/user/user.entity";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("comments")
@Index(["postId", "parentId", "createdAt"])
@Index(["postId", "parentId", "score"])
@Index(["postId", "rootId"])
@Index(["authorId", "createdAt"])

//CommentStatus dùng để quản lý trạng thái của comment thay vì xóa comment khỏi database ngay lập tức.
export enum CommentStatus {
  ACTIVE = 'active', //Comment bình thường, đang hiển thị.
  DELETED = 'deleted',//Người dùng tự xóa comment.Nhưng vẫn giữ comment trong database để không làm hỏng cây reply.Nếu xóa hẳn Comment A, thì Reply B, Reply C có thể mất cha hoặc cây comment bị lỗi. Vì vậy chỉ đổi status thành DELETED.

  REMOVED = 'removed',//Admin/moderator gỡ comment vì vi phạm quy định.
  SPAM = 'spam',//Comment bị đánh dấu là spam.
}

export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column()
  postId: number; //Comment thuộc bài viết nào

  @Column()
  authorId: number; //Ai viết comment

  @Column({ nullable: true })
  parentId?: number; //Comment này reply comment nào

  @Column({ nullable: true })
  rootId: string | null;

  @Column({ type: "int", default: 0 })
  depth: number;

  @Column({ type: "varchar", length: 500, nullable: true })
  path: string | null;

  @Column({
    type: "enum",
    enum: CommentStatus,
    default: CommentStatus.ACTIVE,
  })
  status: CommentStatus;

  @Column({ type: "int", default: 0 })
  upvoteCount: number;

  @Column({ type: "int", default: 0 })
  downvoteCount: number;

  @Column({ type: "int", default: 0 })
  score: number;


//Một comment thuộc một user.
//Nếu user bị xóa, comment cũng bị xóa theo.
//Lưu ý: Với hệ thống thực tế, có khi không nên CASCADE khi xóa user, vì sẽ mất toàn bộ comment. Có thể dùng SET NULL hoặc giữ user dạng deleted account.
  @ManyToOne(() => UserEntity, (user) => user.comments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "authorId" })
  author: UserEntity;

/*
Nếu comment cha bị xóa, parentId của comment con sẽ thành null, vì:onDelete: 'SET NULL'.Tức là reply con không bị xóa theo.

Comment A
  Comment B

B.parentId = A.id
*/
  @ManyToOne(() => CommentEntity, (comment) => comment.children, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parentId" })
  parent: CommentEntity | null;

  /*
  Comment có children
  Một comment có thể có nhiều reply con.

  Comment A
  Reply B
  Reply C

  A.children = [B, C]
  */
  @OneToMany(() => CommentEntity, (comment) => comment.parent)
  children: CommentEntity[];

//Một comment có nhiều vote.
//Bảng CommentVote thường dùng để đảm bảo mỗi user chỉ vote một lần cho một comment.

@OneToMany(() => CommentVote, (vote) => vote.comment)
votes: CommentVote[];

@Column({ type: 'int', default: 0 })
replyCount: number; 

@Column({ type: 'timestamp', nullable: true })
editedAt: Date | null; //Dùng để biết comment đã từng bị sửa chưa.



//Đây là soft delete của TypeORM.
//Khi dùng soft delete, record không bị xóa thật khỏi database. TypeORM chỉ set deletedAt
@DeleteDateColumn()
deletedAt: Date | null;

@CreateDateColumn()
createdAt: Date; //Tự động lưu thời điểm comment được tạo.


@UpdateDateColumn()
updatedAt: Date;  //Tự động cập nhật mỗi khi comment bị chỉnh sửa.Bất kỳ thay đổi nào trong row, ví dụ vote count, status, replyCount. editat Chỉ nên đổi khi user sửa nội dung comment


//1 comment → chỉ thuộc về 1 post
//1 post → có nhiều comment
 @ManyToOne(() => PostEntity, (post) => post.comments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "postId" })
  post: PostEntity;


 
}


/*
6. Why store vote counters on comments?
You could calculate score with:
SQL
SELECT SUM(value) FROM comment_votes WHERE comment_id = $1;
But this becomes expensive at scale.
Better approach:
comments.score
comments.upvoteCount
comments.downvoteCount
These are denormalized counters.
Good
•	fast reads
•	sorting by score is easy
•	avoids counting votes repeatedly
Bad
•	must update counters carefully
•	race conditions are possible
•	needs transactions
For a portfolio project, denormalized counters are impressive because they show you understand read-heavy systems.

*/