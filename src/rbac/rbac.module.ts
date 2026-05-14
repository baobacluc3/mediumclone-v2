import { Module } from "@nestjs/common";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserModule } from "../user/user.module";
import { RbacController } from "./rbac.controller";

@Module({
  // UserModule provides JwtAuthGuard and JwtStrategy for authenticated demo routes.
  imports: [UserModule],
  controllers: [RbacController],
  providers: [RolesGuard],
})
export class RbacModule {}
