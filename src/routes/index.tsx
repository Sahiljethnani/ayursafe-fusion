import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Leaf, Sparkles, ShieldCheck, Activity, ArrowRight, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AyurSafe — Sign in" },
      {
        name: "description",
        content: "Sign in to AyurSafe — Bridging Ayurveda and Modern Medicine Safely with AI.",
      },
      { property: "og:title", content: "AyurSafe — Sign in" },
      { property: "og:description", content: "Bridging Ayurveda and Modern Medicine Safely with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

type Mode = "signin" | "signup" | "forgot";

/** Map provider errors to friendly, non-leaky messages. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please verify your email before signing in. Check your inbox.";
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already exists"))
    return "An account with this email already exists. Try signing in instead.";
  if (m.includes("password should be") || m.includes("weak")) return "Password is too weak. Use at least 8 characters.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Network error. Check your connection and try again.";
  if (m.includes("expired")) return "This link has expired. Please request a new one.";
  return message || "Something went wrong. Please try again.";
}

function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Password must contain at least one letter and one number.";
  return null;
}

function Landing() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ kind: "verify" | "reset"; email: string } | null>(null);

  // Only redirect once the provider has actually confirmed a session.
  useEffect(() => {
    if (!authLoading && session) navigate({ to: "/dashboard" });
  }, [authLoading, session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (mode === "forgot") {
      setSubmitting(true);
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSubmitting(false);
      if (error) {
        toast.error(friendlyAuthError(error.message));
        return;
      }
      setNotice({ kind: "reset", email: trimmedEmail });
      return;
    }

    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        toast.error("Please enter your full name.");
        return;
      }
      const problem = passwordProblem(password);
      if (problem) {
        toast.error(problem);
        return;
      }

      setSubmitting(true);
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: name.trim() },
        },
      });
      setSubmitting(false);

      if (error) {
        toast.error(friendlyAuthError(error.message));
        return;
      }
      // Identity already existed → provider returns a user with no identities.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.error("An account with this email already exists. Try signing in instead.");
        return;
      }
      if (!data.session) {
        setNotice({ kind: "verify", email: trimmedEmail });
        return;
      }
      toast.success("Welcome to AyurSafe!");
      return; // the auth listener redirects
    }

    // Sign in — verified entirely by the auth provider.
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
    setSubmitting(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    toast.success("Welcome back!");
  };

  const handleGoogle = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(friendlyAuthError(String(result.error.message ?? "Google sign-in failed.")));
        setSubmitting(false);
        return;
      }
      if (result.redirected) return;
      toast.success("Signed in with Google.");
    } catch (err) {
      toast.error(err instanceof Error ? friendlyAuthError(err.message) : "Google sign-in was cancelled.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Floating decorative herbs/particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/20 absolute -top-20 -left-20 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-trust/20 absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full blur-3xl" />
        <div className="bg-primary-glow/20 absolute -bottom-40 left-1/3 h-96 w-96 rounded-full blur-3xl" />

        <Leaf
          className="text-primary/30 animate-float-slow absolute top-24 left-1/4 h-10 w-10"
          style={{ animationDelay: "0s" }}
        />
        <Leaf
          className="text-primary-glow/40 animate-float-slow absolute top-40 right-1/3 h-6 w-6"
          style={{ animationDelay: "1.5s" }}
        />
        <Sparkles
          className="text-trust/40 animate-float-slow absolute bottom-32 left-1/3 h-7 w-7"
          style={{ animationDelay: "3s" }}
        />
        <Leaf
          className="text-primary/25 animate-float-slow absolute right-20 bottom-40 h-12 w-12 rotate-45"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-12 px-6 py-10 lg:grid-cols-2 lg:gap-20 lg:py-20">
        {/* Left: Branding */}
        <section className="flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary shadow-glow flex h-12 w-12 items-center justify-center rounded-2xl">
              <Leaf className="h-6 w-6 text-primary-foreground" strokeWidth={2.4} />
            </div>
            <div className="leading-tight">
              <div className="text-xl font-bold tracking-tight">AyurSafe</div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                AI Healthcare
              </div>
            </div>
          </div>

          <div className="animate-fade-up py-10">
            <span className="glass text-primary mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by Knowledge Graph + LLM
            </span>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Bridging <span className="text-gradient-primary">Ayurveda</span>
              <br />
              and Modern <span className="text-gradient-hero">Medicine</span> Safely
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground sm:text-lg">
              Detect dangerous herb-drug interactions before they happen. AyurSafe analyses
              your prescription with clinical AI to keep every patient safe.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, label: "Clinically validated" },
                { icon: Activity, label: "Real-time analysis" },
                { icon: Leaf, label: "10k+ herbs mapped" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="glass shadow-card flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                >
                  <f.icon className="text-primary h-4 w-4" strokeWidth={2.4} />
                  <span className="text-xs font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden text-xs text-muted-foreground lg:block">
            © {new Date().getFullYear()} AyurSafe · For research & educational use
          </div>
        </section>

        {/* Right: Auth */}
        <section className="flex items-center justify-center">
          <div className="glass shadow-elegant animate-scale-in w-full max-w-md rounded-3xl p-8 sm:p-10">
            {notice ? (
              <div className="text-center">
                <div className="bg-primary/10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
                  <MailCheck className="text-primary h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-bold tracking-tight">Check your email</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {notice.kind === "verify"
                    ? "We sent a verification link to"
                    : "We sent a password reset link to"}{" "}
                  <span className="text-foreground font-semibold">{notice.email}</span>.{" "}
                  {notice.kind === "verify"
                    ? "Verify your email, then sign in to continue."
                    : "Open it to choose a new password."}
                </p>
                <button
                  onClick={() => {
                    setNotice(null);
                    setMode("signin");
                    setPassword("");
                  }}
                  className="bg-gradient-primary text-primary-foreground shadow-elegant transition-smooth mt-7 w-full rounded-xl px-5 py-3 text-sm font-semibold hover:opacity-95"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <div className="bg-muted/60 mb-7 flex rounded-full p-1">
                  {(["signin", "signup"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`transition-smooth flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
                        mode === m
                          ? "bg-card text-foreground shadow-card"
                          : "text-muted-foreground"
                      }`}
                    >
                      {m === "signin" ? "Sign in" : "Create account"}
                    </button>
                  ))}
                </div>

                <h2 className="text-2xl font-bold tracking-tight">
                  {mode === "signin" ? "Welcome back" : mode === "signup" ? "Get started" : "Reset your password"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mode === "signin"
                    ? "Sign in to continue your safety analysis."
                    : mode === "signup"
                      ? "Join clinicians using AyurSafe daily."
                      : "We'll email you a secure link to set a new password."}
                </p>

                <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                  {mode === "signup" && (
                    <Field
                      label="Full name"
                      type="text"
                      placeholder="Dr. Asha Patel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  )}
                  <Field
                    label="Email"
                    type="email"
                    placeholder="you@clinic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  {mode !== "forgot" && (
                    <Field
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    />
                  )}

                  {mode === "signup" && (
                    <p className="text-[11px] text-muted-foreground">
                      Use at least 8 characters with a letter and a number.
                    </p>
                  )}

                  {mode !== "signup" && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setMode(mode === "forgot" ? "signin" : "forgot")}
                        className="text-primary text-xs font-semibold hover:underline"
                      >
                        {mode === "forgot" ? "Back to sign in" : "Forgot password?"}
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-gradient-primary text-primary-foreground shadow-elegant transition-smooth group flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold hover:opacity-95 disabled:opacity-60"
                  >
                    {submitting
                      ? "Please wait…"
                      : mode === "signin"
                        ? "Sign in"
                        : mode === "signup"
                          ? "Create account"
                          : "Send reset link"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  {mode !== "forgot" && (
                    <>
                      <div className="flex items-center gap-3 py-2">
                        <div className="bg-border h-px flex-1" />
                        <span className="text-xs text-muted-foreground">or continue with</span>
                        <div className="bg-border h-px flex-1" />
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogle}
                        disabled={submitting}
                        className="border-border bg-card/60 hover:bg-card transition-smooth w-full rounded-xl border px-4 py-2.5 text-sm font-medium disabled:opacity-60"
                      >
                        Continue with Google
                      </button>
                    </>
                  )}
                </form>
              </>
            )}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing you agree to AyurSafe's clinical-use guidelines.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground">{label}</span>
      <input
        {...rest}
        className="bg-card/70 border-border focus:border-primary focus:ring-primary/20 transition-smooth w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-4"
      />
    </label>
  );
}
