import { Global, Module } from "@nestjs/common";

import { MailService } from "./mail.service";

/** Global so auth and user flows can send mail without re-importing. */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
