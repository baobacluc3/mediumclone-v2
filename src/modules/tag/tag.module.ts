import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { TagEntity } from "./entities/tag.entity";
import { TagService } from "./services/tag.service";
import { TagController } from "./controllers/tag.controller";

@Module({
  imports: [TypeOrmModule.forFeature([TagEntity])],
  providers: [TagService],
  controllers: [TagController],
  exports: [TagService],
})
export class TagModule {}
