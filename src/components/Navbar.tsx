import { Link, useRouterState } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/upload", label: "Upload" },
  { to: "/recommendations", label: "Recommendations" },
  { to: "/history", label: "History" },
] as const;

export function Navbar() {
  const { location } = useRouterState();
  const path = location.pathname;
  // Hide nav on the landing/login screen
  if (path === "/") return null;

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-4 pt-4">
        <div className="glass shadow-card flex items-center justify-between rounded-2xl px-4 py-3 sm:px-6">
          <Link to="/dashboard" className="group flex items-center gap-2.5">
            <div className="bg-gradient-primary shadow-glow flex h-9 w-9 items-center justify-center rounded-xl">
              <Leaf className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight">AyurSafe</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                AI Healthcare
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = path.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`transition-smooth rounded-xl px-4 py-2 text-sm font-medium ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/upload"
              className="bg-gradient-primary shadow-elegant transition-smooth hidden rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 sm:inline-flex"
            >
              New Analysis
            </Link>
            <div className="ring-primary/20 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-trust text-sm font-semibold text-primary-foreground ring-2">
              A
            </div>
          </div>
        </div>

        <nav className="mt-2 flex items-center gap-1 overflow-x-auto md:hidden">
          {links.map((l) => {
            const active = path.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`transition-smooth shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "glass text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
