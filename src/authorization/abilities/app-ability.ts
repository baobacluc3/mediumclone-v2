import { MongoAbility } from "@casl/ability";

import { CommentEntity } from "@/comments/comment.entity";
import { PostEntity } from "@/posts/post.entity";
import { TagEntity } from "@/tag/tag.entity";
import { UserEntity } from "@/user/user.entity";
import { Action } from "../domain/action.enum";
import { AppSubject } from "../domain/app-subject.enum";
import { PermissionEntity } from "../entities/permission.entity";
import { RoleEntity } from "../entities/role.entity";

/**
 * The strongly-typed CASL ability for this application: a rule set over
 * (action, subject) pairs with optional Mongo-style conditions (e.g. matching
 * `authorId` for ownership checks).
 */
export type AppAbility = MongoAbility<[Action, AppSubject]>;

/** Property CASL's `subject()` helper sets to tag a plain object's type. */
const CASL_SUBJECT_TYPE_KEY = "__caslSubjectType__";

/**
 * Maps a value being checked to its CASL subject type.
 *
 * - strings (e.g. `AppSubject.Article`) are used as-is for type-level checks;
 * - objects tagged via CASL's `subject()` helper report their tagged type, so
 *   ownership conditions can be evaluated without loading the full entity;
 * - loaded domain entities are mapped by `instanceof` so callers can check a
 *   concrete instance (`ability.can(Action.Update, post)`) and have its
 *   conditions (ownership) evaluated against real field values.
 */
export function detectSubjectType(value: unknown): AppSubject {
  if (typeof value === "string") {
    return value as AppSubject;
  }

  if (value && typeof value === "object" && CASL_SUBJECT_TYPE_KEY in value) {
    return (value as Record<string, AppSubject>)[CASL_SUBJECT_TYPE_KEY];
  }

  if (value instanceof PostEntity) return AppSubject.Article;
  if (value instanceof CommentEntity) return AppSubject.Comment;
  if (value instanceof UserEntity) return AppSubject.User;
  if (value instanceof TagEntity) return AppSubject.Tag;
  if (value instanceof RoleEntity) return AppSubject.Role;
  if (value instanceof PermissionEntity) return AppSubject.Permission;

  return (value as { constructor?: { name?: string } })?.constructor
    ?.name as AppSubject;
}

/** A predicate over the caller's ability, used by the `@CheckPolicies` guard. */
export interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;
