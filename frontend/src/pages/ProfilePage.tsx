import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { articlesApi, profilesApi } from "../api/endpoints";
import type { Article, Profile } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ArticleList, Pagination } from "../components/ArticleList";
import { Avatar } from "../components/Avatar";

const PAGE_SIZE = 10;

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<"authored" | "favorited">("authored");
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setProfile(null);
    setError(null);
    setTab("authored");
    setOffset(0);
    profilesApi
      .get(username)
      .then(({ profile }) => setProfile(profile))
      .catch((err: Error) => setError(err.message));
  }, [username]);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    articlesApi
      .list({
        [tab === "authored" ? "author" : "favorited"]: username,
        limit: PAGE_SIZE,
        offset,
      })
      .then((data) => {
        if (cancelled) return;
        setArticles(data.posts);
        setTotal(data.postsCount);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username, tab, offset]);

  async function toggleFollow() {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!profile || !username) return;
    const { profile: updated } = profile.following
      ? await profilesApi.unfollow(username)
      : await profilesApi.follow(username);
    setProfile(updated);
  }

  if (error)
    return (
      <div className="container" style={{ padding: "2.5rem 1.25rem" }}>
        <p className="error-banner">{error}</p>
      </div>
    );

  if (!profile)
    return (
      <div className="profile-hero">
        <div className="container">
          <span
            className="skeleton avatar avatar-xl"
            style={{ display: "inline-block" }}
          />
          <div
            className="skeleton"
            style={{ width: 160, height: 24, margin: "1rem auto 0" }}
          />
        </div>
      </div>
    );

  const isSelf = user?.username === profile.username;

  return (
    <div>
      <div className="profile-hero">
        <div className="container">
          <Avatar username={profile.username} image={profile.image} size="xl" />
          <h2>{profile.username}</h2>
          {profile.bio && <p className="bio">{profile.bio}</p>}
          {isSelf ? (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate("/settings")}
            >
              Edit profile
            </button>
          ) : (
            <button
              className={
                profile.following
                  ? "btn btn-ghost btn-sm"
                  : "btn btn-primary btn-sm"
              }
              onClick={toggleFollow}
            >
              {profile.following ? "Unfollow" : "Follow"} {profile.username}
            </button>
          )}
        </div>
      </div>

      <div className="container layout" style={{ gridTemplateColumns: "1fr" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
          <div className="feed-tabs" style={{ marginBottom: "1.25rem" }}>
            <button
              className={tab === "authored" ? "tab active" : "tab"}
              onClick={() => {
                setTab("authored");
                setOffset(0);
              }}
            >
              Articles
            </button>
            <button
              className={tab === "favorited" ? "tab active" : "tab"}
              onClick={() => {
                setTab("favorited");
                setOffset(0);
              }}
            >
              Favorited
            </button>
          </div>
          <ArticleList
            articles={articles}
            loading={loading}
            emptyMessage={
              tab === "authored"
                ? `${profile.username} hasn't published anything yet.`
                : `${profile.username} hasn't favorited anything yet.`
            }
          />
          <Pagination
            total={total}
            limit={PAGE_SIZE}
            offset={offset}
            onPage={setOffset}
          />
        </div>
      </div>
    </div>
  );
}
