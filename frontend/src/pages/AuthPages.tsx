import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function useSubmit(action: () => Promise<void>) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await action();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return { error, busy, handleSubmit };
}

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { error, busy, handleSubmit } = useSubmit(() => login(email, password));

  return (
    <div className="form-page">
      <h1>Welcome back</h1>
      <p className="form-sub">
        New here? <Link to="/register">Create an account</Link>
      </p>
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {error && <p className="error-banner">{error}</p>}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { error, busy, handleSubmit } = useSubmit(() =>
    register(username, email, password),
  );

  return (
    <div className="form-page">
      <h1>Join conduit</h1>
      <p className="form-sub">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {error && <p className="error-banner">{error}</p>}
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              placeholder="yourname"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              minLength={3}
              maxLength={30}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
