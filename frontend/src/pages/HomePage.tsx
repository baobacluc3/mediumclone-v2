import { useEffect, useState } from "react";
import { articlesApi, tagsApi } from "../api/endpoints";
import type { Article } from "../api/types";
import { ArticleList, Pagination } from "../components/ArticleList";

const PAGE_SIZE = 10;

export function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tagsApi
      .list()
      .then(({ data }) => setTags(data.map((tag) => tag.name)))
      .catch(() => setTags([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    articlesApi
      .list({
        tag: activeTag ?? undefined,
        search: submittedSearch || undefined,
        limit: PAGE_SIZE,
        offset,
      })
      .then((data) => {
        if (cancelled) return;
        setArticles(data.posts);
        setTotal(data.postsCount);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTag, submittedSearch, offset]);

  function selectTag(tag: string | null) {
    setActiveTag(tag);
    setOffset(0);
  }

  return (
    <div>
      <div className="banner">
        <div className="container">
          <h1>conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </div>

      <div className="container page">
        <div className="main-column">
          <div className="feed-toolbar">
            <div className="feed-tabs">
              <button
                className={activeTag ? "tab" : "tab active"}
                onClick={() => selectTag(null)}
              >
                Global Feed
              </button>
              {activeTag && <span className="tab active"># {activeTag}</span>}
            </div>
            <form
              className="search"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmittedSearch(search.trim());
                setOffset(0);
              }}
            >
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search articles…"
              />
            </form>
          </div>

          <ArticleList articles={articles} loading={loading} />
          <Pagination
            total={total}
            limit={PAGE_SIZE}
            offset={offset}
            onPage={setOffset}
          />
        </div>

        <aside className="sidebar">
          <h3>Popular Tags</h3>
          {tags.length === 0 ? (
            <p className="hint">No tags yet.</p>
          ) : (
            <ul className="tag-list">
              {tags.map((tag) => (
                <li key={tag}>
                  <button
                    className={`tag ${activeTag === tag ? "active" : ""}`}
                    onClick={() => selectTag(tag)}
                  >
                    {tag}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
