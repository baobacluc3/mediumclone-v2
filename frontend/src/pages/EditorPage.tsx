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
    <div className="container editor-page">
      <h1>{slug ? "Edit Article" : "New Article"}</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Article title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={255}
          required
        />
        <input
          placeholder="What's this article about?"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={500}
          required
        />
        <textarea
          placeholder="Write your article (plain text)"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={10}
          required
        />
        <input
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
        <button type="submit" disabled={busy}>
          {busy ? "Publishing…" : "Publish Article"}
        </button>
      </form>
    </div>
  );
}
