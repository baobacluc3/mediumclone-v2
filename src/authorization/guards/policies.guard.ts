import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";

import { AuthUser } from "@/auth/types/auth-user.type";
import { AppAbility, PolicyHandler } from "../abilities/app-ability";
import { CaslAbilityFactory } from "../abilities/casl-ability.factory";
import {
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
  POLICIES_KEY,
} from "../domain/authorization.constants";
import { RequiredPermission } from "../decorators/require-permissions.decorator";
import { AuthorizationAuditService } from "../services/authorization-audit.service";

/**
 * Global authorization guard. Runs after authentication and enforces any
 * `@RequirePermissions` and `@CheckPolicies` metadata by building the caller's
 * CASL ability and evaluating every requirement (logical AND). Routes without
 * such metadata pass through untouched.
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: CaslAbilityFactory,
    private readonly audit: AuthorizationAuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];

    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const requiredPermissions =
      this.reflector.getAllAndOverride<RequiredPermission[]>(
        PERMISSIONS_KEY,
        targets,
      ) ?? [];
    const policyHandlers =
      this.reflector.getAllAndOverride<PolicyHandler[]>(
        POLICIES_KEY,
        targets,
      ) ?? [];

    if (!requiredPermissions.length && !policyHandlers.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException("Authentication is required.");
    }

    const ability = await this.abilityFactory.createForUser(user);

    const permitted =
      requiredPermissions.every((permission) =>
        ability.can(permission.action, permission.subject),
      ) && policyHandlers.every((handler) => this.run(handler, ability));

    if (!permitted) {
      this.audit.accessDenied({
        userId: user.id,
        method: request.method,
        path: request.originalUrl ?? request.url,
        reason: "insufficient permissions",
      });
      throw new ForbiddenException(
        "You do not have permission for this action.",
      );
    }

    return true;
  }

  private run(handler: PolicyHandler, ability: AppAbility): boolean {
    return typeof handler === "function"
      ? handler(ability)
      : handler.handle(ability);
  }
}
