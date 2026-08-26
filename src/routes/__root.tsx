import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppSidebar } from "@/components/AppSidebar";
import { AiPanel, AiDrawer } from "@/components/AiPanel";
import { MobileNav } from "@/components/MobileNav";
import { ScrollShadows, useScrollShadow } from "@/components/ScrollShadow";
import { TooltipProvider } from "@/components/ui/tooltip";

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
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
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
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
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
  const { ref, top, bottom } = useScrollShadow<HTMLElement>();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAssistant = pathname === "/assistente";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <div className="flex min-h-dvh w-full bg-background">
          <AppSidebar />
          <div className="relative min-w-0 flex-1">
            <ScrollShadows top={top} bottom={bottom} />
            <main
              ref={ref}
              id="app-scroll"
              className={
                isAssistant
                  ? "h-dvh min-w-0 overflow-hidden pb-16 md:pb-0"
                  : "h-dvh min-w-0 overflow-y-auto pb-20 md:pb-0"
              }
            >
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </main>
          </div>
          {!isAssistant && <AiPanel />}
          {!isAssistant && <AiDrawer />}
          <MobileNav />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

