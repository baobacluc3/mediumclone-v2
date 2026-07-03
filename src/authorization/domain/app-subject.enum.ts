/**
 * The resources (CASL "subjects") that authorization rules can target.
 *
 * Values intentionally match the domain entity names so that a loaded entity
 * instance can be matched against a rule via {@link detectSubjectType}.
 * `All` is CASL's wildcard subject and matches every resource.
 */
export enum AppSubject {
  Article = "Article",
  User = "User",
  Tag = "Tag",
  Role = "Role",
  Permission = "Permission",
  All = "all",
}
