import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { articlesApi } from "../api/endpoints";

export function EditorPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    articlesApi
      .get(slug)
      .then(({ post }) => {
        setTitle(post.title);
        setDescription(post.description);
        setBody(post.body);
        setTags(post.tagList.join(", "));
      })
      .catch((err: Error) => setError(err.message));
  }, [slug]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const post = {
      title,
      description,
      body,
      tagList: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    try {
      const result = slug
        ? await articlesApi.update(slug, post)
        : await articlesApi.create(post);
      navigate(`/article/${result.post.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form-page wide">
      <h1>{slug ? "Edit article" : "New article"}</h1>
      <p className="form-sub">Share something worth reading.</p>
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {error && <p className="error-banner">{error}</p>}
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              placeholder="How I built…"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={255}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="description">Short description</label>
            <input
              id="description"
              placeholder="What's this article about?"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="body">Body</label>
            <textarea
              id="body"
              placeholder="Write your article. Separate paragraphs with a blank line."
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={12}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="tags">Tags</label>
            <input
              id="tags"
              placeholder="react, typescript (comma separated)"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Publishing…" : "Publish article"}
          </button>
        </form>
      </div>
    </div>
  );
}
