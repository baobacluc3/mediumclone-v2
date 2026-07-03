import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { articlesApi } from "../api/endpoints";
import type { Article } from "../api/types";
import { useAuth } from "../auth/AuthContext";

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The API doesn't report per-user favorite state, so track what the user
  // did in this session; favorite/unfavorite are idempotent server-side.
  const [favorited, setFavorited] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    articlesApi
      .get(slug)
      .then(({ post }) => setArticle(post))
      .catch((err: Error) => setError(err.message));
  }, [slug]);

  if (error) return <p className="container error">{error}</p>;
  if (!article) return <p className="container hint">Loading…</p>;

  const isAuthor = user?.username === article.author.username;

  async function toggleFavorite() {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!article || busy) return;
    setBusy(true);
    try {
      const { post } = favorited
        ? await articlesApi.unfavorite(article.slug)
        : await articlesApi.favorite(article.slug);
      setArticle(post);
      setFavorited(!favorited);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!article || !window.confirm("Delete this article?")) return;
    await articlesApi.remove(article.slug);
    navigate("/");
  }

  return (
    <div>
      <div className="article-banner">
        <div className="container">
          <h1>{article.title}</h1>
          <div className="article-meta">
            <Link to={`/profile/${article.author.username}`} className="author">
              <span>
                {article.author.username}
                <small>
                  {new Date(article.createdAt).toLocaleDateString()}
                </small>
              </span>
            </Link>
            <button
              className="button button-outline"
              onClick={toggleFavorite}
              disabled={busy}
            >
              {favorited ? "♥ Unfavorite" : "♡ Favorite"} (
              {article.favoriteCount})
            </button>
            {isAuthor && (
              <>
                <Link
                  className="button button-outline"
                  to={`/editor/${article.slug}`}
                >
                  Edit
                </Link>
                <button className="button button-danger" onClick={handleDelete}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container article-body">
        <p className="article-description">{article.description}</p>
        {article.body.split(/\n{2,}/).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        {article.tagList.length > 0 && (
          <ul className="tag-list">
            {article.tagList.map((tag) => (
              <li key={tag} className="tag tag-outline">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
