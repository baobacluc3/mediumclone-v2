import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [image, setImage] = useState(user?.image ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await userApi.update({ image, username, bio, email });
      await refreshUser();
      navigate(`/profile/${username}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form-page">
      <h1>Your settings</h1>
      <p className="form-sub">Update how you appear on conduit.</p>
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {error && <p className="error-banner">{error}</p>}
          <div className="field">
            <label htmlFor="image">Profile picture URL</label>
            <input
              id="image"
              placeholder="https://…"
              value={image}
              onChange={(event) => setImage(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              placeholder="A short bio about you"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
