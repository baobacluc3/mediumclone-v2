/**
 * Canonical set of actions a user can attempt against a subject.
 *
 * These map directly onto CASL ability verbs. `Manage` is CASL's wildcard and
 * represents "any action", so granting `manage` on a subject implies
 * create/read/update/delete on it.
 */
export enum Action {
  Manage = "manage",
  Create = "create",
  Read = "read",
  Update = "update",
  Delete = "delete",
}
