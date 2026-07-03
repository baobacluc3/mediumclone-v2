import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

import { IS_PUBLIC_KEY } from "@/authorization/domain/authorization.constants";

/**
 * Global authentication guard. Validates the JWT for every request except those
 * explicitly marked with `@Public()`, populating `request.user` for downstream
 * authorization. Registered once as an APP_GUARD, so individual routes no longer
 * need `@UseGuards(JwtAuthGuard)`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Best-effort authentication: when a valid token accompanies a public
      // request, attach the user so the endpoint can personalize its response
      // (e.g. the `favorited` flag) — but never reject an anonymous caller.
      try {
        await super.canActivate(context);
      } catch {
        // Anonymous or invalid token: proceed without a user.
      }
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
