import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

//Request → Guard → JwtStrategy → validate user → attach to request.user

//no token - reject request
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
