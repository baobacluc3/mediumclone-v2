import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import { Injectable } from "@nestjs/common";

import { AuthUser } from "@/auth/types/auth-user.type";
import { Action } from "../domain/action.enum";
import { AppSubject } from "../domain/app-subject.enum";
import { RolesService } from "../services/roles.service";
import { AppAbility, detectSubjectType } from "./app-ability";

/**
 * Builds a CASL ability for a given principal.
 *
 * Role-derived permissions are loaded (and cached) by {@link RolesService} and
 * granted unconditionally. On top of those, every authenticated principal gets
 * conditional, ownership-based rules so they can always manage their own
 * resources — this is the part that goes "beyond basic role checks".
 */
@Injectable()
export class CaslAbilityFactory {
  constructor(private readonly rolesService: RolesService) {}

  async createForUser(user: AuthUser | undefined): Promise<AppAbility> {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    const permissions = await this.rolesService.resolvePermissionsForRoles(
      user?.roles ?? [],
    );

    for (const { action, subject } of permissions) {
      can(action, subject);
    }

    if (user?.id) {
      // Authors may always manage their own articles and comments...
      can(Action.Update, AppSubject.Article, { authorId: user.id });
      can(Action.Delete, AppSubject.Article, { authorId: user.id });
      can(Action.Delete, AppSubject.Comment, { authorId: user.id });
      // ...and every user may manage their own account.
      can(Action.Read, AppSubject.User, { id: user.id });
      can(Action.Update, AppSubject.User, { id: user.id });
      can(Action.Delete, AppSubject.User, { id: user.id });
    }

    return build({ detectSubjectType });
  }
}
