/**
 * The authenticated principal attached to each request after the JWT is
 * validated. `roles` holds role *names* (e.g. "admin"); permissions are derived
 * from these names by the authorization layer, never stored on the token.
 */
export interface AuthUser {
  id: number;
  email?: string;
  roles: string[];
}
