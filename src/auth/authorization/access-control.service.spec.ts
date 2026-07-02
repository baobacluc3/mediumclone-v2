import { AccessControlService } from "./access-control.service";
import { Permission, ROLE_PERMISSIONS } from "../permissions";
import { UserRole } from "../types/auth-user.type";

describe("AccessControlService", () => {
  let service: AccessControlService;

  beforeEach(() => {
    service = new AccessControlService();
  });

  describe("normalizeRoles", () => {
    it("defaults to USER when roles are missing or empty", () => {
      expect(service.normalizeRoles()).toEqual([UserRole.USER]);
      expect(service.normalizeRoles([])).toEqual([UserRole.USER]);
    });

    it("removes duplicates and unknown roles", () => {
      const roles = service.normalizeRoles([
        UserRole.ADMIN,
        UserRole.ADMIN,
        "superuser" as UserRole,
      ]);

      expect(roles).toEqual([UserRole.ADMIN]);
    });
  });

  describe("hasAnyRole", () => {
    it("passes when no roles are required", () => {
      expect(service.hasAnyRole([UserRole.USER], [])).toBe(true);
    });

    it("accepts an exact role match", () => {
      expect(
        service.hasAnyRole([UserRole.MODERATOR], [UserRole.MODERATOR]),
      ).toBe(true);
    });

    it("lets a higher role satisfy a lower requirement (hierarchy)", () => {
      expect(service.hasAnyRole([UserRole.ADMIN], [UserRole.MODERATOR])).toBe(
        true,
      );
    });

    it("rejects a lower role for a higher requirement", () => {
      expect(service.hasAnyRole([UserRole.USER], [UserRole.ADMIN])).toBe(false);
    });
  });

  describe("hasEveryPermission", () => {
    it("passes when no permissions are required", () => {
      expect(service.hasEveryPermission([UserRole.USER], [])).toBe(true);
    });

    it("grants a role its own permissions", () => {
      expect(
        service.hasEveryPermission(
          [UserRole.USER],
          [Permission.CREATE_ARTICLE],
        ),
      ).toBe(true);
    });

    it("denies permissions the role does not have", () => {
      expect(
        service.hasEveryPermission([UserRole.USER], [Permission.MANAGE_TAGS]),
      ).toBe(false);
      expect(
        service.hasEveryPermission(
          [UserRole.MODERATOR],
          [Permission.DELETE_ANY_ARTICLE],
        ),
      ).toBe(false);
    });

    it("requires ALL listed permissions, not just one", () => {
      expect(
        service.hasEveryPermission(
          [UserRole.MODERATOR],
          [Permission.MANAGE_TAGS, Permission.DELETE_ANY_USER],
        ),
      ).toBe(false);
    });

    it("combines permissions across multiple roles", () => {
      expect(
        service.hasEveryPermission(
          [UserRole.USER, UserRole.MODERATOR],
          [Permission.CREATE_ARTICLE, Permission.MANAGE_TAGS],
        ),
      ).toBe(true);
    });
  });

  describe("permission inheritance", () => {
    it("moderators inherit every user permission", () => {
      for (const permission of ROLE_PERMISSIONS[UserRole.USER]) {
        expect(ROLE_PERMISSIONS[UserRole.MODERATOR]).toContain(permission);
      }
    });

    it("admins inherit every moderator permission", () => {
      for (const permission of ROLE_PERMISSIONS[UserRole.MODERATOR]) {
        expect(ROLE_PERMISSIONS[UserRole.ADMIN]).toContain(permission);
      }
    });

    it("admins hold every defined permission", () => {
      for (const permission of Object.values(Permission)) {
        expect(ROLE_PERMISSIONS[UserRole.ADMIN]).toContain(permission);
      }
    });
  });

  describe("isOwnerOrHasPermission", () => {
    const owner = { id: 1, roles: [UserRole.USER] };
    const otherUser = { id: 2, roles: [UserRole.USER] };
    const admin = { id: 3, roles: [UserRole.ADMIN] };

    it("allows the resource owner regardless of permissions", () => {
      expect(
        service.isOwnerOrHasPermission(owner, 1, Permission.DELETE_ANY_USER),
      ).toBe(true);
    });

    it("allows a non-owner holding the override permission", () => {
      expect(
        service.isOwnerOrHasPermission(admin, 1, Permission.DELETE_ANY_USER),
      ).toBe(true);
    });

    it("denies a non-owner without the override permission", () => {
      expect(
        service.isOwnerOrHasPermission(
          otherUser,
          1,
          Permission.DELETE_ANY_USER,
        ),
      ).toBe(false);
    });
  });
});
