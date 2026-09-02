import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search['email'] === "string" ? search['email'] : "",
  }),
  head: () => ({
    meta: [
      { title: "Reset password — AyurSafe" },
      { name: "description", content: "Securely verify your reset code and set a new AyurSafe password." },
      { property: "og:title", content: "Reset password — AyurSafe" },
      { property: "og:description", content: "Securely set a new AyurSafe password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Password must contain at least one letter and one number.";
  return null;
}

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("expired") || m.includes("invalid")) return "That code is invalid or has expired. Request a new one.";
  if (m.includes("rate") || m.includes("too many")) return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("same password")) return "Choose a password different from your previous one.";
  return message || "Something went wrong. Please try again.";
}

function ResetPassword() {
  const navigate = useNavigate();
  const { email: emailParam } = Route.useSearch();

  const [step, setStep] = useState<"code" | "password">("code");
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [done, setDone] = useState(false);

  // Arriving via the emailed recovery link already yields a recovery session.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setStep("password");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setStep("password");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter the email you requested the reset for.");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: trimmed,
      token: code.trim(),
      type: "recovery",
    });
    setBusy(false);
    if (error) {
      toast.error(friendly(error.message));
      return;
    }
    toast.success("Code verified. Choose a new password.");
    setStep("password");
  };

  const resend = async () => {
    if (cooldown > 0 || busy) return;
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Enter your email first.");
      return;
    }
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    setCooldown(60);
    // Never reveal whether the address is registered.
    toast.success("If that email is registered, a new reset code is on its way.");
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const problem = passwordProblem(password);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      toast.error(friendly(error.message));
      return;
    }
    await supabase.auth.signOut();
    setBusy(false);
    setDone(true);
    toast.success("Password updated. Please sign in with your new password.");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/20 absolute -top-20 -left-20 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-trust/20 absolute -right-32 bottom-0 h-[26rem] w-[26rem] rounded-full blur-3xl" />
      </div>

      <div className="glass shadow-elegant animate-scale-in relative w-full max-w-md rounded-3xl p-8 sm:p-10">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-primary shadow-glow flex h-10 w-10 items-center justify-center rounded-xl">
            <Leaf className="text-primary-foreground h-5 w-5" strokeWidth={2.4} />
          </div>
          <span className="text-lg font-bold tracking-tight">AyurSafe</span>
        </div>

        {done ? (
          <div className="mt-8 text-center">
            <div className="bg-primary/10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
              <ShieldCheck className="text-primary h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight">Password updated</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Your password has been changed securely. Sign in with your new password to continue.
            </p>
            <Link
              to="/"
              className="bg-gradient-primary text-primary-foreground shadow-elegant transition-smooth mt-7 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold hover:opacity-95"
            >
              Go to sign in
            </Link>
          </div>
        ) : step === "code" ? (
          <>
            <div className="bg-primary/10 mt-8 flex h-12 w-12 items-center justify-center rounded-2xl">
              <KeyRound className="text-primary h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight">Enter your reset code</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              We emailed you a 6-digit verification code. You can also open the secure link in the same
              email to skip this step.
            </p>

            <form className="mt-7 space-y-4" onSubmit={verifyCode}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clinic.com"
                  autoComplete="email"
                  className="border-border bg-background/60 focus:ring-primary/30 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                  Verification code
                </span>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="border-border bg-background/60 focus:ring-primary/30 w-full rounded-xl border px-4 py-3 text-center font-mono text-lg tracking-[0.5em] outline-none focus:ring-2"
                />
              </label>

              <button
                type="submit"
                disabled={busy}
                className="bg-gradient-primary text-primary-foreground shadow-elegant transition-smooth w-full rounded-xl px-5 py-3 text-sm font-semibold hover:opacity-95 disabled:opacity-60"
              >
                {busy ? "Verifying…" : "Verify code"}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={resend}
                disabled={cooldown > 0 || busy}
                className="text-primary font-semibold hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
              <Link to="/" className="text-muted-foreground font-semibold hover:underline">
                Back to sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="bg-primary/10 mt-8 flex h-12 w-12 items-center justify-center rounded-2xl">
              <ShieldCheck className="text-primary h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight">Create a new password</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Choose a strong password you haven't used before.
            </p>

            <form className="mt-7 space-y-4" onSubmit={submitPassword}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                  New password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="border-border bg-background/60 focus:ring-primary/30 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                  Confirm password
                </span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="border-border bg-background/60 focus:ring-primary/30 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
                />
              </label>
              <p className="text-[11px] text-muted-foreground">
                At least 8 characters with a letter and a number.
              </p>
              <button
                type="submit"
                disabled={busy}
                className="bg-gradient-primary text-primary-foreground shadow-elegant transition-smooth w-full rounded-xl px-5 py-3 text-sm font-semibold hover:opacity-95 disabled:opacity-60"
              >
                {busy ? "Updating…" : "Update password"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="text-muted-foreground mt-5 w-full text-xs font-semibold hover:underline"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </main>
  );
}
