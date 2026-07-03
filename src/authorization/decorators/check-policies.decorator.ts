import { SetMetadata } from "@nestjs/common";

import { PolicyHandler } from "../abilities/app-ability";
import { POLICIES_KEY } from "../domain/authorization.constants";

/**
 * Attach one or more policy handlers to a route. Each receives the caller's
 * CASL ability and must return `true` for access to be granted (logical AND).
 * Useful for richer, type-level rules than a flat permission list can express.
 */
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(POLICIES_KEY, handlers);
