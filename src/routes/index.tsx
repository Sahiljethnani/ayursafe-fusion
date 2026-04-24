import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Leaf, Sparkles, ShieldCheck, Activity, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSession, setSession } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AyurSafe — Sign in" },
      {
        name: "description",
        content: "Sign in to AyurSafe — Bridging Ayurveda and Modern Medicine Safely with AI.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-redirect if already signed in
  useEffect(() => {
    if (getSession()) navigate({ to: "/dashboard" });
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const displayName =
        mode === "signup"
          ? name.trim()
          : trimmedEmail
              .split("@")[0]
              .replace(/[._-]+/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
      setSession({ email: trimmedEmail, name: displayName, loggedInAt: Date.now() });
      toast.success(mode === "signin" ? `Welcome back, ${displayName}!` : `Welcome to AyurSafe, ${displayName}!`);
      navigate({ to: "/dashboard" });
    }, 600);
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
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-gradient-primary shadow-glow flex h-12 w-12 items-center justify-center rounded-2xl">
              <Leaf className="h-6 w-6 text-primary-foreground" strokeWidth={2.4} />
            </div>
            <div className="leading-tight">
              <div className="text-xl font-bold tracking-tight">AyurSafe</div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                AI Healthcare
              </div>
            </div>
          </Link>

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
              {mode === "signin" ? "Welcome back" : "Get started"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to continue your safety analysis."
                : "Join clinicians using AyurSafe daily."}
            </p>

            <form
              className="mt-7 space-y-4"
              onSubmit={handleSubmit}
            >
              {mode === "signup" && (
                <Field
                  label="Full name"
                  type="text"
                  placeholder="Dr. Asha Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
              <Field
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />

              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-primary text-primary-foreground shadow-elegant transition-smooth group flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold hover:opacity-95 disabled:opacity-60"
              >
                {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <div className="flex items-center gap-3 py-2">
                <div className="bg-border h-px flex-1" />
                <span className="text-xs text-muted-foreground">or continue with</span>
                <div className="bg-border h-px flex-1" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SocialBtn label="Google" />
                <SocialBtn label="Apple" />
              </div>
            </form>

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

function SocialBtn({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="border-border bg-card/60 hover:bg-card transition-smooth rounded-xl border px-4 py-2.5 text-sm font-medium"
    >
      {label}
    </button>
  );
}
