import { Global, Module } from "@nestjs/common";
import { CacheService } from "./cache.service";

/** Global so any service can opt into caching without extra imports. */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
