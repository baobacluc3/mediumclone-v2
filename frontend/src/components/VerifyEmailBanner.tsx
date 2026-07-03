import { useState } from "react";
import { authApi } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";

/** Slim reminder shown to signed-in users whose email isn't verified yet. */
export function VerifyEmailBanner() {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.emailVerified || dismissed) return null;

  async function resend() {
    if (!user || busy) return;
    setBusy(true);
    try {
      await authApi.resendVerification(user.email);
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="verify-banner">
      <span>
        {sent
          ? "Verification email sent — check your inbox."
          : "Please verify your email address."}
      </span>
      {!sent && (
        <button className="btn btn-ghost btn-sm" onClick={resend} disabled={busy}>
          {busy ? "Sending…" : "Resend email"}
        </button>
      )}
      <button
        className="verify-banner-close"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
