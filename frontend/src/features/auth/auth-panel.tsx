"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "./auth-context";

type Mode = "login" | "register" | "verify" | "forgot" | "reset";

export function AuthPanel({ reason, onAuthenticated }: { reason?: string; onAuthenticated?: () => void }) {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [token, setToken] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function changeMode(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "login") {
        await auth.signIn(email, password);
        onAuthenticated?.();
      } else if (mode === "register") {
        await auth.register({ email, password, givenName, familyName, termsAccepted, privacyAcknowledged });
        setNotice("Account created. Open the confirmation link sent to your email, or enter its verification code here.");
        setMode("verify");
      } else if (mode === "verify") {
        await auth.verifyEmail(email, token);
        setNotice("Email verified. You can now sign in.");
        setMode("login");
      } else if (mode === "forgot") {
        await auth.forgotPassword(email);
        setNotice("If the account exists, reset instructions have been sent.");
        setMode("reset");
      } else {
        await auth.resetPassword(token, password);
        setNotice("Password updated. Sign in with your new password.");
        setMode("login");
      }
    } catch (cause) {
      const message = cause instanceof ApiError ? cause.message : "Unable to reach the account service. Please try again.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "login" ? "Welcome back" : mode === "register" ? "Create your player account" : mode === "verify" ? "Verify your email" : mode === "forgot" ? "Reset your password" : "Choose a new password";

  return (
    <div className="auth-panel">
      <span className="auth-icon" aria-hidden="true">{mode === "login" ? <UserRound /> : mode === "verify" ? <Mail /> : mode === "register" ? <ShieldCheck /> : <KeyRound />}</span>
      <span className="kicker">PLAYER ACCOUNT</span>
      <h1>{title}</h1>
      <p>{reason ?? "Sign in to manage bookings, favorites, and your PickleTayo profile."}</p>
      {notice && <div className="form-notice" role="status"><CheckCircle2 size={18} />{notice}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <form onSubmit={submit} className="auth-form">
        {mode === "register" && <div className="form-row"><label>First name<input required autoComplete="given-name" value={givenName} onChange={(event) => setGivenName(event.target.value)} /></label><label>Last name<input required autoComplete="family-name" value={familyName} onChange={(event) => setFamilyName(event.target.value)} /></label></div>}
        {(mode === "login" || mode === "register" || mode === "verify" || mode === "forgot") && <label>Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>}
        {(mode === "login" || mode === "register" || mode === "reset") && <label>{mode === "reset" ? "New password" : "Password"}<input required type="password" minLength={mode === "login" ? undefined : 12} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} /><small>{mode !== "login" && "Use 12+ characters with upper-case, lower-case, and a number."}</small></label>}
        {(mode === "verify" || mode === "reset") && <label>{mode === "verify" ? "Verification token" : "Reset token"}<input required autoComplete="one-time-code" value={token} onChange={(event) => setToken(event.target.value.trim())} /></label>}
        {mode === "register" && <div className="consent-list"><label><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} required /> I accept the Terms of Service.</label><label><input type="checkbox" checked={privacyAcknowledged} onChange={(event) => setPrivacyAcknowledged(event.target.checked)} required /> I acknowledge the Privacy Policy.</label></div>}
        <button className="primary auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : mode === "verify" ? "Verify email" : mode === "forgot" ? "Send reset instructions" : "Update password"}</button>
      </form>
      <div className="auth-links">
        {mode !== "login" && <button onClick={() => changeMode("login")}>Back to sign in</button>}
        {mode === "login" && <><button onClick={() => changeMode("register")}>Create account</button><button onClick={() => changeMode("forgot")}>Forgot password?</button></>}
        {mode === "verify" && <button onClick={() => auth.resendVerification(email).then(() => setNotice("A new verification token has been requested.")).catch(() => setError("Could not resend verification."))}>Resend verification</button>}
      </div>
    </div>
  );
}
