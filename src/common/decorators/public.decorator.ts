import { SetMetadata } from "@nestjs/common";

import { IS_PUBLIC_KEY } from "@/auth/authorization/authorization.constants";

//Opt-out of the global JwtAuthGuard: the route is reachable without a token.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
