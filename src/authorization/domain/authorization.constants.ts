/** Reflector metadata keys used by the authorization decorators and guards. */
export const IS_PUBLIC_KEY = "authorization:isPublic";
export const PERMISSIONS_KEY = "authorization:requiredPermissions";
export const POLICIES_KEY = "authorization:policyHandlers";

/**
 * Optional bootstrap escape hatch: on startup the seeder grants the admin role
 * to the user whose email matches this env var, so the very first administrator
 * can exist without manual DB edits.
 */
export const BOOTSTRAP_ADMIN_EMAIL_ENV = "RBAC_BOOTSTRAP_ADMIN_EMAIL";
