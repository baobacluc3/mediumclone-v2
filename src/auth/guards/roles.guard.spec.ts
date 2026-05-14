import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../../common/role.enum";
import { RolesGuard } from "./roles.guard";

const createContext = (role?: Role): ExecutionContext =>
  ({
    // RolesGuard asks for the route handler when reading metadata.
    getHandler: jest.fn(),
    // RolesGuard asks for the controller class when reading metadata.
    getClass: jest.fn(),
    // RolesGuard switches to HTTP to read request.user.role.
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: role ? { role } : undefined,
      }),
    }),
  }) as unknown as ExecutionContext;

describe("RolesGuard", () => {
  it("allows routes without role metadata", () => {
    const reflector = {
      // No metadata means the route is not role-protected.
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it("allows a user with a required role", () => {
    const reflector = {
      // The route requires an admin role.
      getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext(Role.ADMIN))).toBe(true);
  });

  it("denies a user without a required role", () => {
    const reflector = {
      // The route requires an admin role, but the user is only a normal user.
      getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext(Role.USER))).toBe(false);
  });
});
