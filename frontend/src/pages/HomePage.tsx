import { useEffect, useState } from "react";
import { articlesApi, tagsApi } from "../api/endpoints";
import type { Article } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ArticleList, Pagination } from "../components/ArticleList";
import { SearchIcon } from "../components/Icons";

const PAGE_SIZE = 10;

export function HomePage() {
  const { user } = useAuth();
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
      {!user && (
        <div className="hero">
          <div className="container">
            <h1>Stories worth sharing.</h1>
            <p>
              A community publishing platform — read, write, and connect with
              people who care about the same ideas.
            </p>
            <div className="hero-badges">
              <span className="hero-badge">NestJS API</span>
              <span className="hero-badge">React frontend</span>
              <span className="hero-badge">PostgreSQL</span>
              <span className="hero-badge">JWT auth + RBAC</span>
            </div>
          </div>
        </div>
      )}

      <div className="container layout">
        <div>
          <div className="feed-toolbar">
            <div className="feed-tabs">
              <button
                className={activeTag ? "tab" : "tab active"}
                onClick={() => selectTag(null)}
              >
                Latest
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
              <SearchIcon />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search articles…"
              />
            </form>
          </div>

          <ArticleList
            articles={articles}
            loading={loading}
            emptyMessage={
              submittedSearch || activeTag
                ? "Nothing matches this filter. Try something else."
                : "Be the first to publish something."
            }
          />
          <Pagination
            total={total}
            limit={PAGE_SIZE}
            offset={offset}
            onPage={setOffset}
          />
        </div>

        <aside>
          <div className="sidebar-card">
            <h3>Popular Tags</h3>
            {tags.length === 0 ? (
              <p className="hint" style={{ margin: 0, fontSize: "0.9rem" }}>
                Tags will appear as articles are published.
              </p>
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
          </div>
          <div className="sidebar-card">
            <h3>About</h3>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              A full-stack Medium clone: NestJS + TypeORM + PostgreSQL behind a
              React SPA, with JWT refresh auth and role-based permissions.{" "}
              <a
                href="https://github.com/baobacluc3/mediumclone-v2"
                target="_blank"
                rel="noreferrer"
              >
                Read the source →
              </a>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
