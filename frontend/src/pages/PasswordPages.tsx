import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { message } = await authApi.forgotPassword(email.trim());
      setSent(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form-page">
      <h1>Forgot your password?</h1>
      <p className="form-sub">
        Remembered it after all? <Link to="/login">Sign in</Link>
      </p>
      <div className="form-card">
        {sent ? (
          <p className="hint" style={{ margin: 0 }}>
            {sent} Check your inbox — the link is valid for 1 hour.
          </p>
        ) : (
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
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { message } = await authApi.resetPassword(token, password);
      setDone(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="form-page">
        <h1>Reset password</h1>
        <div className="form-card">
          <p className="error-banner">
            This page needs the link from your reset email.{" "}
            <Link to="/forgot-password">Request a new one</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <h1>Choose a new password</h1>
      <div className="form-card">
        {done ? (
          <p className="hint" style={{ margin: 0 }}>
            {done} <Link to="/login">Sign in</Link>
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p className="error-banner">{error}</p>}
            <div className="field">
              <label htmlFor="password">New password</label>
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
            <div className="field">
              <label htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                type="password"
                placeholder="Same as above"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"verifying" | "done" | "failed">(
    "verifying",
  );
  const [message, setMessage] = useState("");
  // React 18 StrictMode mounts twice in dev; the token is single-use, so make
  // sure we only spend it once.
  const requested = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("failed");
      setMessage("This page needs the link from your verification email.");
      return;
    }
    if (requested.current) return;
    requested.current = true;

    authApi
      .verifyEmail(token)
      .then(({ message }) => {
        setStatus("done");
        setMessage(message);
        return refreshUser();
      })
      .catch((err: Error) => {
        setStatus("failed");
        setMessage(err.message || "Verification failed.");
      });
  }, [token, refreshUser]);

  return (
    <div className="form-page">
      <h1>Email verification</h1>
      <div className="form-card">
        {status === "verifying" && <p className="hint">Verifying…</p>}
        {status === "done" && (
          <p className="hint" style={{ margin: 0 }}>
            {message} <Link to="/">Back to the feed</Link>
          </p>
        )}
        {status === "failed" && <p className="error-banner">{message}</p>}
      </div>
    </div>
  );
}
