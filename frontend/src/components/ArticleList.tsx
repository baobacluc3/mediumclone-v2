import { Link, useNavigate } from "react-router-dom";
import type { Article } from "../api/types";
import { readingTime, timeAgo } from "../lib/format";
import { Avatar } from "./Avatar";
import { BookIcon, HeartIcon } from "./Icons";

export function ArticlePreview({ article }: { article: Article }) {
  const navigate = useNavigate();

  return (
    <article
      className="article-card"
      style={{ cursor: "pointer" }}
      onClick={() => navigate(`/article/${article.slug}`)}
    >
      <div className="card-meta">
        <Link
          to={`/profile/${article.author.username}`}
          onClick={(event) => event.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
        >
          <Avatar
            username={article.author.username}
            image={article.author.image}
            size="sm"
          />
          <span className="author-name">{article.author.username}</span>
        </Link>
        <span className="dot">·</span>
        <time dateTime={article.createdAt}>{timeAgo(article.createdAt)}</time>
        <span className="dot">·</span>
        <span className="read-time">{readingTime(article.body)}</span>
      </div>

      <h2>{article.title}</h2>
      <p className="excerpt">{article.description}</p>

      <div className="card-footer">
        {article.tagList.length > 0 ? (
          <ul className="tag-list">
            {article.tagList.slice(0, 4).map((tag) => (
              <li key={tag} className="tag tag-static">
                {tag}
              </li>
            ))}
          </ul>
        ) : (
          <span />
        )}
        <span className="heart">
          <HeartIcon filled={article.favoriteCount > 0} />
          {article.favoriteCount}
        </span>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="article-card">
      <div className="card-meta">
        <span className="skeleton avatar avatar-sm" />
        <span className="skeleton" style={{ width: 110, height: 14 }} />
      </div>
      <div className="skeleton" style={{ width: "70%", height: 22, marginBottom: 10 }} />
      <div className="skeleton" style={{ width: "95%", height: 14, marginBottom: 6 }} />
      <div className="skeleton" style={{ width: "60%", height: 14 }} />
    </div>
  );
}

export function ArticleList({
  articles,
  loading,
  emptyMessage = "No articles are here… yet.",
}: {
  articles: Article[];
  loading: boolean;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <div>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="empty-state">
        <BookIcon />
        <h3>Nothing here yet</h3>
        <p>{emptyMessage}</p>
        <Link to="/editor" className="btn btn-primary btn-sm">
          Write the first article
        </Link>
      </div>
    );
  }

  return (
    <div>
      {articles.map((article) => (
        <ArticlePreview key={article.slug} article={article} />
      ))}
    </div>
  );
}

export function Pagination({
  total,
  limit,
  offset,
  onPage,
}: {
  total: number;
  limit: number;
  offset: number;
  onPage: (offset: number) => void;
}) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  const current = Math.floor(offset / limit);

  return (
    <nav className="pagination">
      {Array.from({ length: pages }, (_, i) => (
        <button
          key={i}
          className={i === current ? "page-btn active" : "page-btn"}
          onClick={() => onPage(i * limit)}
        >
          {i + 1}
        </button>
      ))}
    </nav>
  );
}
