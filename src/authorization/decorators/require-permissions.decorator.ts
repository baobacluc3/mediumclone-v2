import { SetMetadata } from "@nestjs/common";

import { Action } from "../domain/action.enum";
import { AppSubject } from "../domain/app-subject.enum";
import { PERMISSIONS_KEY } from "../domain/authorization.constants";

/** A type-level capability requirement enforced by the {@link PoliciesGuard}. */
export interface RequiredPermission {
  action: Action;
  subject: AppSubject;
}

/**
 * Require the caller to hold every listed permission (logical AND). For
 * instance-level / ownership checks that need the loaded resource, perform the
 * check in the service via `CaslAbilityFactory` instead.
 */
export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
