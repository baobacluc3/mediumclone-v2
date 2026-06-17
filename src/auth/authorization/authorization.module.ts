import { Module } from "@nestjs/common";

import { AccessControlGuard } from "./access-control.guard";
import { AccessControlService } from "./access-control.service";

@Module({
  providers: [AccessControlGuard, AccessControlService],
  exports: [AccessControlGuard, AccessControlService],
})
export class AuthorizationModule {}
