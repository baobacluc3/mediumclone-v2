import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AccessControlGuard } from "./access-control.guard";
import { AccessControlService } from "./access-control.service";
import {
  REQUIRED_PERMISSIONS_KEY,
  REQUIRED_ROLES_KEY,
} from "./authorization.constants";
import { Permission } from "../permissions";
import { AuthUser, UserRole } from "../types/auth-user.type";

describe("AccessControlGuard", () => {
  let guard: AccessControlGuard;
  let reflector: Reflector;

  const createContext = (user?: AuthUser): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  const setRouteMetadata = (metadata: {
    roles?: UserRole[];
    permissions?: Permission[];
  }) => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockImplementation((key: unknown) => {
        if (key === REQUIRED_ROLES_KEY) return metadata.roles;
        if (key === REQUIRED_PERMISSIONS_KEY) return metadata.permissions;
        return undefined;
      });
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AccessControlGuard(reflector, new AccessControlService());
  });

  it("allows routes without role or permission metadata", () => {
    setRouteMetadata({});

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it("throws 401 when the route is protected and no user is attached", () => {
    setRouteMetadata({ permissions: [Permission.MANAGE_TAGS] });

    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
  });

  it("allows a user whose roles grant the required permission", () => {
    setRouteMetadata({ permissions: [Permission.MANAGE_TAGS] });

    const context = createContext({ id: 1, roles: [UserRole.MODERATOR] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws 403 when the user lacks the required permission", () => {
    setRouteMetadata({ permissions: [Permission.MANAGE_USER_ROLES] });

    const context = createContext({ id: 1, roles: [UserRole.MODERATOR] });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("lets a higher role pass a lower role requirement", () => {
    setRouteMetadata({ roles: [UserRole.MODERATOR] });

    const context = createContext({ id: 1, roles: [UserRole.ADMIN] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws 403 when the role requirement is not met", () => {
    setRouteMetadata({ roles: [UserRole.ADMIN] });

    const context = createContext({ id: 1, roles: [UserRole.USER] });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("requires BOTH role and permission checks to pass when both are set", () => {
    setRouteMetadata({
      roles: [UserRole.MODERATOR],
      permissions: [Permission.DELETE_ANY_USER],
    });

    //Moderator meets the role requirement but lacks the admin permission.
    const context = createContext({ id: 1, roles: [UserRole.MODERATOR] });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
