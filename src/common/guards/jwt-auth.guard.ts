import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

//Request → Guard → JwtStrategy → validate user → attach to request.user

//no token - reject request
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}

//no token - still allow
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (!request.headers.authorization) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err) {
      return null as TUser;
    }

    return (user ?? null) as TUser;
  }
}
