import { Action } from "./action.enum";
import { AppSubject } from "./app-subject.enum";

/** A single (action, subject) capability that can be attached to roles. */
export interface PermissionDefinition {
  action: Action;
  subject: AppSubject;
  description: string;
}

/** The minimal (action, subject) shape used to grant CASL rules. */
export type PermissionTuple = Pick<PermissionDefinition, "action" | "subject">;

/** The names of the roles seeded and protected by the system. */
export enum DefaultRole {
  User = "user",
  Moderator = "moderator",
  Admin = "admin",
}

/** Every user falls back to this role when they have none assigned. */
export const DEFAULT_ROLE_NAME: string = DefaultRole.User;

/**
 * The full catalog of permissions the application understands. The seeder
 * upserts exactly these rows, so this is the single source of truth for what
 * capabilities exist. Adding a new capability is a one-line change here.
 *
 * Note: ownership-based abilities ("edit your OWN article") are NOT modelled as
 * permissions — they are expressed as conditional CASL rules in the ability
 * factory and apply to every authenticated user regardless of role.
 */
export const PERMISSION_CATALOG: PermissionDefinition[] = [
  {
    action: Action.Create,
    subject: AppSubject.Article,
    description: "Create articles",
  },
  {
    action: Action.Update,
    subject: AppSubject.Article,
    description: "Update any article, including those authored by others",
  },
  {
    action: Action.Delete,
    subject: AppSubject.Article,
    description: "Delete any article, including those authored by others",
  },
  {
    action: Action.Create,
    subject: AppSubject.Comment,
    description: "Comment on articles",
  },
  {
    action: Action.Delete,
    subject: AppSubject.Comment,
    description: "Delete any comment, including those authored by others",
  },
  {
    action: Action.Manage,
    subject: AppSubject.Tag,
    description: "Create, update and delete tags",
  },
  {
    action: Action.Delete,
    subject: AppSubject.User,
    description: "Delete any user account",
  },
  {
    action: Action.Manage,
    subject: AppSubject.Role,
    description: "Manage roles, their permissions and user role assignments",
  },
  {
    action: Action.Read,
    subject: AppSubject.Role,
    description: "View roles and the permission catalog",
  },
];

export interface RoleDefinition {
  name: DefaultRole;
  description: string;
  permissions: Array<Pick<PermissionDefinition, "action" | "subject">>;
}

/**
 * Default roles seeded on boot. Permission sets preserve the behaviour of the
 * previous static RBAC: members author their own content, moderators also
 * manage tags, and admins hold every capability.
 */
export const ROLE_CATALOG: RoleDefinition[] = [
  {
    name: DefaultRole.User,
    description: "Standard member who can author and manage their own content",
    permissions: [
      { action: Action.Create, subject: AppSubject.Article },
      { action: Action.Create, subject: AppSubject.Comment },
    ],
  },
  {
    name: DefaultRole.Moderator,
    description:
      "Trusted member who can additionally curate tags and moderate comments",
    permissions: [
      { action: Action.Create, subject: AppSubject.Article },
      { action: Action.Create, subject: AppSubject.Comment },
      { action: Action.Delete, subject: AppSubject.Comment },
      { action: Action.Manage, subject: AppSubject.Tag },
    ],
  },
  {
    name: DefaultRole.Admin,
    description: "Administrator with full access to all resources",
    permissions: [
      { action: Action.Create, subject: AppSubject.Article },
      { action: Action.Update, subject: AppSubject.Article },
      { action: Action.Delete, subject: AppSubject.Article },
      { action: Action.Create, subject: AppSubject.Comment },
      { action: Action.Delete, subject: AppSubject.Comment },
      { action: Action.Manage, subject: AppSubject.Tag },
      { action: Action.Delete, subject: AppSubject.User },
      { action: Action.Manage, subject: AppSubject.Role },
      { action: Action.Read, subject: AppSubject.Role },
    ],
  },
];
