import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedUser } from "./auth.types";

export const User = createParamDecorator((data: any, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
  const user = req.user;

  if (!user) {
    return undefined;
  }

  return data ? user[data] : user;
});
