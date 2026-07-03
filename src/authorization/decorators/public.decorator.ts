import { SetMetadata } from "@nestjs/common";

import { IS_PUBLIC_KEY } from "../domain/authorization.constants";

/**
 * Marks a route (or controller) as publicly accessible, bypassing the global
 * authentication guard. Use for endpoints like login, registration and public
 * reads.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
