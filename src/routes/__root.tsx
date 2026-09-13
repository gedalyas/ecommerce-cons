import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  createRootRouteWithContext,
  retainSearchParams,
  stripSearchParams,
  useRouter,
  HeadContent,
  Scripts,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "@/shared/styles/global.css?url";
import { reportError } from "@/shared/utils/errorReporting";
import { defaultPeriodSearch, parsePeriodSearch, type PeriodSearch } from "@/shared/utils/period";
import { AppShell } from "@/shared/layout/AppShell";
import { AssistantFab, AssistantPanel } from "@/modules/assistant/contract";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="t-section-title text-foreground">404</h1>
        <h2 className="t-card-title mt-4 text-foreground">Page not found</h2>
        <p className="t-meta mt-2 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="t-card-title text-foreground">This page didn't load</h1>
        <p className="t-meta mt-2 text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-4 text-[13px] font-semibold text-foreground transition-colors duration-150 hover:bg-muted"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // The global period lives on the root so every screen shares it. Links keep
  // it across navigations and the URL stays clean while it equals the default.
  validateSearch: (search: Partial<PeriodSearch> & SearchSchemaInput): PeriodSearch =>
    parsePeriodSearch(search),
  search: {
    middlewares: [
      retainSearchParams(["inicio", "fim", "por", "comparar", "canal"]),
      stripSearchParams(defaultPeriodSearch),
    ],
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Loja Aurora · Consultoria de e-commerce" },
      {
        name: "description",
        content:
          "Painel de consultoria de e-commerce: indicadores de dinheiro, marketing, logística e gestão em um só lugar.",
      },
      { property: "og:title", content: "Loja Aurora · Consultoria de e-commerce" },
      {
        property: "og:description",
        content: "Indicadores de dinheiro, marketing, logística e gestão em um só painel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
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
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell assistant={<AssistantPanel />} assistantFab={<AssistantFab />} />
    </QueryClientProvider>
  );
}
