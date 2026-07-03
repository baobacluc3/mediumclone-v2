import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { commentsApi } from "../api/endpoints";
import type { Comment } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { timeAgo } from "../lib/format";
import { Avatar } from "./Avatar";

const PAGE_SIZE = 10;

export function CommentSection({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    commentsApi
      .list(slug, { limit: PAGE_SIZE })
      .then(({ comments, commentsCount }) => {
        setComments(comments);
        setTotal(commentsCount);
      })
      .catch(() => {
        setComments([]);
        setTotal(0);
      });
  }, [slug]);

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const { comments: page, commentsCount } = await commentsApi.list(slug, {
        limit: PAGE_SIZE,
        offset: comments.length,
      });
      // Dedupe on id in case a comment was posted between page loads and
      // shifted the offset window.
      setComments((current) => {
        const seen = new Set(current.map((comment) => comment.id));
        return [...current, ...page.filter((comment) => !seen.has(comment.id))];
      });
      setTotal(commentsCount);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim() || busy) return;
    setError(null);
    setBusy(true);
    try {
      const { comment } = await commentsApi.create(slug, body.trim());
      setComments((current) => [comment, ...current]);
      setTotal((count) => count + 1);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    await commentsApi.remove(slug, id);
    setComments((current) => current.filter((comment) => comment.id !== id));
    setTotal((count) => Math.max(0, count - 1));
  }

  return (
    <section className="comments">
      <h3>
        Comments{total > 0 && <span> ({total})</span>}
      </h3>

      {user ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          {error && <p className="error-banner">{error}</p>}
          <textarea
            placeholder="Share your thoughts…"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            maxLength={2000}
            required
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={busy || !body.trim()}
          >
            {busy ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="hint comment-signin">
          <Link to="/login">Sign in</Link> to join the discussion.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="hint">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((comment) => (
            <li key={comment.id} className="comment">
              <div className="comment-header">
                <Link
                  to={`/profile/${comment.author.username}`}
                  className="comment-author"
                >
                  <Avatar
                    username={comment.author.username}
                    image={comment.author.image}
                    size="sm"
                  />
                  <span>{comment.author.username}</span>
                </Link>
                <time dateTime={comment.createdAt}>
                  {timeAgo(comment.createdAt)}
                </time>
                {user?.username === comment.author.username && (
                  <button
                    className="comment-delete"
                    onClick={() => handleDelete(comment.id)}
                    title="Delete comment"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="comment-body">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      {comments.length < total && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore
            ? "Loading…"
            : `Show more comments (${total - comments.length})`}
        </button>
      )}
    </section>
  );
}
