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
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await userApi.update({ image, username, bio, email });
      await refreshUser();
      setSaved(true);
      navigate(`/profile/${username}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container auth-page">
      <h1>Your Settings</h1>
      {error && <p className="error">{error}</p>}
      {saved && <p className="hint">Settings saved.</p>}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="URL of profile picture"
          value={image}
          onChange={(event) => setImage(event.target.value)}
        />
        <input
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
        <textarea
          placeholder="Short bio about you"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={5}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Update Settings"}
        </button>
      </form>
    </div>
  );
}
