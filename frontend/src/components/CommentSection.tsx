import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { commentsApi } from "../api/endpoints";
import type { Comment } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { timeAgo } from "../lib/format";
import { Avatar } from "./Avatar";

export function CommentSection({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    commentsApi
      .list(slug)
      .then(({ comments }) => setComments(comments))
      .catch(() => setComments([]));
  }, [slug]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim() || busy) return;
    setError(null);
    setBusy(true);
    try {
      const { comment } = await commentsApi.create(slug, body.trim());
      setComments((current) => [comment, ...current]);
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
  }

  return (
    <section className="comments">
      <h3>
        Comments{comments.length > 0 && <span> ({comments.length})</span>}
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
    </section>
  );
}
