import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { articlesApi, profilesApi } from "../api/endpoints";
import type { Article, Profile } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ArticleList, Pagination } from "../components/ArticleList";

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

  if (error) return <p className="container error">{error}</p>;
  if (!profile) return <p className="container hint">Loading…</p>;

  const isSelf = user?.username === profile.username;

  return (
    <div>
      <div className="profile-banner">
        <div className="container">
          {profile.image && (
            <img src={profile.image} alt="" className="avatar avatar-large" />
          )}
          <h2>{profile.username}</h2>
          {profile.bio && <p>{profile.bio}</p>}
          {isSelf ? (
            <button
              className="button button-outline"
              onClick={() => navigate("/settings")}
            >
              Edit Profile Settings
            </button>
          ) : (
            <button className="button button-outline" onClick={toggleFollow}>
              {profile.following ? "Unfollow" : "Follow"} {profile.username}
            </button>
          )}
        </div>
      </div>

      <div className="container page">
        <div className="main-column">
          <div className="feed-tabs">
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
          <ArticleList articles={articles} loading={loading} />
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
