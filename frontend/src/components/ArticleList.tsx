import { Link } from "react-router-dom";
import type { Article } from "../api/types";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ArticlePreview({ article }: { article: Article }) {
  return (
    <article className="article-preview">
      <div className="article-meta">
        <Link to={`/profile/${article.author.username}`} className="author">
          {article.author.image ? (
            <img src={article.author.image} alt="" className="avatar" />
          ) : (
            <span className="avatar avatar-placeholder">
              {article.author.username[0]?.toUpperCase()}
            </span>
          )}
          <span>
            {article.author.username}
            <small>{formatDate(article.createdAt)}</small>
          </span>
        </Link>
        <span className="favorite-count">♥ {article.favoriteCount}</span>
      </div>
      <Link to={`/article/${article.slug}`} className="preview-link">
        <h2>{article.title}</h2>
        <p>{article.description}</p>
        <span className="read-more">Read more…</span>
      </Link>
      {article.tagList.length > 0 && (
        <ul className="tag-list">
          {article.tagList.map((tag) => (
            <li key={tag} className="tag tag-outline">
              {tag}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function ArticleList({
  articles,
  loading,
}: {
  articles: Article[];
  loading: boolean;
}) {
  if (loading) return <p className="hint">Loading articles…</p>;
  if (articles.length === 0)
    return <p className="hint">No articles are here… yet.</p>;

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
          className={i === current ? "page active" : "page"}
          onClick={() => onPage(i * limit)}
        >
          {i + 1}
        </button>
      ))}
    </nav>
  );
}
