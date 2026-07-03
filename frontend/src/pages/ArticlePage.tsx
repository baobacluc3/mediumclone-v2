import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useNavigate, useParams } from "react-router-dom";
import { articlesApi } from "../api/endpoints";
import type { Article } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Avatar } from "../components/Avatar";
import { CommentSection } from "../components/CommentSection";
import { HeartIcon, PenIcon } from "../components/Icons";
import { fullDate, readingTime } from "../lib/format";

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const favorited = article?.favorited ?? false;

  useEffect(() => {
    if (!slug) return;
    articlesApi
      .get(slug)
      .then(({ post }) => setArticle(post))
      .catch((err: Error) => setError(err.message));
  }, [slug]);

  if (error)
    return (
      <div className="article-page">
        <p className="error-banner">{error}</p>
      </div>
    );

  if (!article)
    return (
      <div className="article-page">
        <div className="skeleton" style={{ width: "80%", height: 38, marginBottom: 24 }} />
        <div className="skeleton" style={{ width: "40%", height: 18, marginBottom: 40 }} />
        <div className="skeleton" style={{ width: "100%", height: 16, marginBottom: 10 }} />
        <div className="skeleton" style={{ width: "95%", height: 16, marginBottom: 10 }} />
        <div className="skeleton" style={{ width: "88%", height: 16 }} />
      </div>
    );

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
    <div className="article-page">
      <h1>{article.title}</h1>

      <div className="article-byline">
        <Link to={`/profile/${article.author.username}`}>
          <Avatar
            username={article.author.username}
            image={article.author.image}
          />
        </Link>
        <div className="byline-info">
          <Link
            to={`/profile/${article.author.username}`}
            className="author-name"
          >
            {article.author.username}
          </Link>
          <span className="byline-sub">
            {fullDate(article.createdAt)} · {readingTime(article.body)}
          </span>
        </div>
        <div className="byline-actions">
          <button
            className={favorited ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
            onClick={toggleFavorite}
            disabled={busy}
          >
            <HeartIcon filled={favorited} />
            {article.favoriteCount}
          </button>
          {isAuthor && (
            <>
              <Link
                className="btn btn-ghost btn-sm"
                to={`/editor/${article.slug}`}
              >
                <PenIcon />
                Edit
              </Link>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {article.description && (
        <p className="article-lede">{article.description}</p>
      )}

      <div className="article-content">
        <ReactMarkdown>{article.body}</ReactMarkdown>
      </div>

      {article.tagList.length > 0 && (
        <div className="article-tags">
          <ul className="tag-list">
            {article.tagList.map((tag) => (
              <li key={tag} className="tag tag-static">
                {tag}
              </li>
            ))}
          </ul>
        </div>
      )}

      <CommentSection slug={article.slug} />
    </div>
  );
}
