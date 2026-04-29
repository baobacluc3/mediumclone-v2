import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import * as jwt from "jsonwebtoken";

type JwtUserPayload = {
  id: number;
  username: string;
  email: string;
};

function getJwtSecret(): string | null {
  return process.env.JWT_SECRET ?? null;
}

export const User = createParamDecorator((data: any, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  if (req.user) {
    return data ? req.user[data] : req.user;
  }

  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader?.startsWith("Bearer ")) {
    return undefined;
  }

  const secret = getJwtSecret();
  if (!secret) {
    return undefined;
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, secret) as JwtUserPayload;
    return data ? decoded[data] : decoded;
  } catch {
    return undefined;
  }
});
