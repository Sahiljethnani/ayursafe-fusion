import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="bg-gradient-mesh flex min-h-screen items-center justify-center px-4">
      <div className="glass shadow-elegant max-w-md rounded-3xl p-10 text-center">
        <h1 className="text-gradient-primary text-7xl font-bold">404</h1>
        <h2 className="mt-3 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist. Return to your dashboard to continue.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="bg-gradient-primary shadow-elegant transition-smooth inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AyurSafe — Bridging Ayurveda and Modern Medicine Safely" },
      {
        name: "description",
        content:
          "AyurSafe is an AI healthcare platform that detects herb-drug interactions between Ayurvedic and modern medicine prescriptions.",
      },
      { name: "author", content: "AyurSafe" },
      { property: "og:title", content: "AyurSafe — AI Healthcare Platform" },
      { property: "og:description", content: "Bridging Ayurveda and Modern Medicine Safely with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="bg-gradient-mesh min-h-screen">
      <Navbar />
      <Outlet />
    </div>
  );
}
