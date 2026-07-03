import "reflect-metadata";
import * as bcrypt from "bcrypt";
import slugify from "slug";

import { AppDataSource } from "./data-source";
import { UserEntity } from "@/user/user.entity";
import { PostEntity } from "@/posts/post.entity";
import { TagEntity } from "@/tag/tag.entity";

/**
 * One-off script to populate demo articles for local/showcase use.
 * Idempotent: re-running skips any article whose slug already exists.
 * Usage: npm run seed:demo
 */

const DEMO_AUTHOR = {
  username: "demo_author",
  email: "demo.author@example.com",
  password: "Demo1234!",
  bio: "Writing about web development and software craftsmanship.",
};

const DEMO_ARTICLES = [
  {
    title: "Getting Started with NestJS",
    description: "A practical introduction to building APIs with NestJS.",
    body: "NestJS combines the best of Express with a structured, Angular-inspired architecture. In this article we walk through setting up your first module, controller, and service, and explain why dependency injection makes testing so much easier.",
    tagList: ["nestjs", "nodejs", "backend"],
  },
  {
    title: "Understanding TypeORM Migrations",
    description: "Why migrations beat auto-sync in real projects.",
    body: "Auto-synchronizing your schema is convenient in a tutorial, but risky in production. This article covers how to generate, run, and revert TypeORM migrations safely, and how to keep entity changes and migration files in lockstep.",
    tagList: ["typeorm", "postgresql", "backend"],
  },
  {
    title: "Designing a Role-Based Access Control System",
    description: "Modeling permissions and roles with CASL.",
    body: "Role-based access control gets complicated fast once you need per-resource ownership checks. This article walks through modeling roles and permissions as data, and enforcing them with CASL abilities instead of scattered if-statements.",
    tagList: ["security", "rbac", "backend"],
  },
  {
    title: "React Fundamentals: Components and Props",
    description: "The building blocks every React app is made of.",
    body: "Before reaching for state management libraries, it's worth mastering the fundamentals: components, props, and composition. This article breaks down how data flows through a React application and why unidirectional data flow keeps UIs predictable.",
    tagList: ["react", "frontend", "javascript"],
  },
  {
    title: "Writing Clean Commit Messages",
    description: "Small habit, big payoff for future you.",
    body: "A good commit message explains why a change was made, not just what changed. This article shares a simple structure for commit messages that makes git log and git blame genuinely useful during debugging and code review.",
    tagList: ["git", "productivity"],
  },
];

async function seed(): Promise<void> {
  const dataSource = await AppDataSource.initialize();

  try {
    const userRepo = dataSource.getRepository(UserEntity);
    const postRepo = dataSource.getRepository(PostEntity);
    const tagRepo = dataSource.getRepository(TagEntity);

    let author = await userRepo.findOne({
      where: { email: DEMO_AUTHOR.email },
    });

    if (!author) {
      const passwordHash = await bcrypt.hash(DEMO_AUTHOR.password, 10);
      author = await userRepo.save(
        userRepo.create({
          username: DEMO_AUTHOR.username,
          email: DEMO_AUTHOR.email,
          bio: DEMO_AUTHOR.bio,
          passwordHash,
        }),
      );
      console.log(`Created demo author "${author.username}"`);
    } else {
      console.log(`Demo author "${author.username}" already exists`);
    }

    for (const article of DEMO_ARTICLES) {
      const slug = slugify(article.title, { lower: true });

      const exists = await postRepo.findOne({ where: { slug } });
      if (exists) {
        console.log(`Skipping existing article "${article.title}"`);
        continue;
      }

      const tagNames = [...new Set(article.tagList)];
      const existingTags = await tagRepo.findBy({});
      const existingByName = new Map(existingTags.map((t) => [t.name, t]));

      const tags: TagEntity[] = [];
      for (const name of tagNames) {
        let tag = existingByName.get(name);
        if (!tag) {
          tag = await tagRepo.save(tagRepo.create({ name }));
          existingByName.set(name, tag);
        }
        tags.push(tag);
      }

      const post = postRepo.create({
        slug,
        title: article.title,
        description: article.description,
        body: article.body,
        tags,
        author,
      });

      await postRepo.save(post);
      console.log(`Created article "${article.title}"`);
    }

    console.log("Demo seed complete.");
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error) => {
  console.error("Demo seed failed:", error);
  process.exit(1);
});
