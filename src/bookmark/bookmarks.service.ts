import { Injectable } from "@nestjs/common";
import { Bookmark } from "./bookmark.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
  ) {}

  async bookmark(userId: number, postId: number) {
    const existingBookmark = await this.bookmarkRepository.findOne({
      where: {
        userId,
        postId,
      },
    });

    if (existingBookmark) {
      this.bookmarkRepository.remove(existingBookmark);
    } else {
      const newBookmark = await this.bookmarkRepository.create({
        user: { id: userId },
        post: { id: postId },
      });
      await this.bookmarkRepository.save(newBookmark);
    }
  }

  async unBookmark(userId: number, postId: number) {
    const existingBookmark = await this.bookmarkRepository.findOne({
      where: {
        userId,
        postId,
      },
    });

    if (!existingBookmark) {
      const newBookmark = await this.bookmarkRepository.create({
        user: { id: userId },
        post: { id: postId },
      });
      await this.bookmarkRepository.save(newBookmark);
    } else {
      this.bookmarkRepository.remove(existingBookmark);
    }
  }
}
