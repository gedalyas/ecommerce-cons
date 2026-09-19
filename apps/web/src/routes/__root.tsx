import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  redirect,
  retainSearchParams,
  useNavigate,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type SearchMiddleware,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, type ReactNode } from "react";

import appCss from "@/shared/styles/global.css?url";
import { reportError } from "@/shared/utils/errorReporting";
import { todayIso } from "@ecommerce/contracts/shared/clock";
import {
  defaultPeriodSearchFor,
  parsePeriodSearch,
  type PeriodSearch,
} from "@ecommerce/contracts/shared/period";
import { AppShell } from "@/shared/layout/AppShell";
import {
  UNDER_DEVELOPMENT_PATH,
  canOpenPath,
  isPathReleased,
  underDevelopmentSlugOf,
} from "@/shared/layout/screenAccess";
import { AssistantFab, AssistantPanel } from "@/modules/assistant/contract";
import { SessionBanner, getSessionState, logoutFn, selectStoreFn } from "@/modules/auth/contract";
import {
  DataReadinessBanner,
  getConnectionsHealth,
  getDataReadiness,
} from "@/modules/connections/contract";
import { getMilestoneSummary } from "@/modules/consulting/contract";
import { areaAccessOf, screenReleaseOf } from "@ecommerce/contracts/auth";

const SHELL_STALE_MS = 5 * 60_000;

const periodKeys = ["inicio", "fim", "por", "comparar", "canal"] as const;

const stripPeriodDefaults: SearchMiddleware<PeriodSearch> = ({ search, next }) => {
  const result = next(search);
  const defaults = defaultPeriodSearchFor(todayIso());
  const stripped = { ...result } as Record<string, unknown>;
  for (const key of periodKeys) if (stripped[key] === defaults[key]) delete stripped[key];
  return stripped as PeriodSearch;
};
const LOGIN_PATH = "/entrar";
const PUBLIC_PATHS = ["/entrar", "/cadastro", "/esqueci-senha", "/redefinir-senha"];
const ONBOARDING_PATH = "/configurar-loja";
const ADMIN_PATH = "/admin";
const isAdminPath = (pathname: string) =>
  pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`);
const ARCHIVED_PATH = "/loja-arquivada";
const emptyStatus = {
  maturity: { achieved: 0, total: 0 },
  connectionsAlert: false,
  hasSource: true,
};

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
  validateSearch: (search: Partial<PeriodSearch> & SearchSchemaInput): PeriodSearch =>
    parsePeriodSearch(search),
  search: {
    middlewares: [
      retainSearchParams(["inicio", "fim", "por", "comparar", "canal"]),
      stripPeriodDefaults,
    ],
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "E-commerce Insights" },
      {
        name: "description",
        content:
          "Painel de consultoria de e-commerce: indicadores de dinheiro, marketing, logística e gestão em um só lugar.",
      },
      { property: "og:title", content: "E-commerce Insights" },
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
  beforeLoad: async ({ location }) => {
    const session = await getSessionState();
    if (!session) {
      if (!PUBLIC_PATHS.includes(location.pathname)) throw redirect({ to: LOGIN_PATH });
      return { session: null };
    }
    const { user, activeStore } = session;
    if (!activeStore) {
      const allowed = isAdminPath(location.pathname) || location.pathname === ONBOARDING_PATH;
      if (!allowed) {
        throw redirect({ to: user.role === "CLIENT" ? ONBOARDING_PATH : ADMIN_PATH });
      }
      return { session };
    }
    const archivedClient = user.role === "CLIENT" && Boolean(activeStore.archivedAt);
    if (archivedClient && location.pathname !== ARCHIVED_PATH) {
      throw redirect({ to: ARCHIVED_PATH });
    }
    if (!archivedClient && location.pathname === ARCHIVED_PATH) throw redirect({ to: "/" });
    if (location.pathname === ONBOARDING_PATH) throw redirect({ to: "/" });
    if (isAdminPath(location.pathname) && user.role === "CLIENT") throw redirect({ to: "/" });
    if (!canOpenPath(location.pathname, areaAccessOf(user))) throw redirect({ to: "/" });
    if (!isPathReleased(location.pathname, screenReleaseOf(user, activeStore))) {
      throw redirect({
        to: UNDER_DEVELOPMENT_PATH,
        search: { tela: underDevelopmentSlugOf(location.pathname) },
      });
    }
    return { session };
  },
  loaderDeps: () => ({}),
  loader: async ({ context }) => {
    const { session } = context;
    if (!session?.activeStore) return { status: emptyStatus };
    if (session.user.role === "CLIENT" && session.activeStore.archivedAt)
      return { status: emptyStatus };
    const [maturity, connections, readiness] = await Promise.all([
      getMilestoneSummary(),
      getConnectionsHealth(),
      getDataReadiness(),
    ]);
    return {
      status: { maturity, connectionsAlert: connections.hasError, hasSource: readiness.hasSource },
    };
  },
  staleTime: SHELL_STALE_MS,
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
  const { session } = Route.useRouteContext();
  const { status } = Route.useLoaderData();
  const user = session?.user ?? null;
  const activeStore = session?.activeStore ?? null;
  const impersonatedBy = session?.impersonatedBy ?? null;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const navigate = useNavigate();
  const release = user ? screenReleaseOf(user, activeStore) : null;
  const assistantReleased = isPathReleased("/assistente", release);
  const logout = useServerFn(logoutFn);
  const select = useServerFn(selectStoreFn);

  if (!user) return <Outlet />;
  const sessionBanner =
    user.role !== "CLIENT" || impersonatedBy ? (
      <SessionBanner userName={user.name} impersonatedBy={impersonatedBy} />
    ) : null;
  if (isAdminPath(pathname)) return <Outlet />;
  if (user.role === "CLIENT" && (!activeStore || activeStore.archivedAt)) {
    return (
      <>
        {sessionBanner}
        <Outlet />
      </>
    );
  }

  const signOut = async () => {
    await logout();
    await router.invalidate();
    await navigate({ to: LOGIN_PATH });
  };
  const switchStore = async (clientId: string) => {
    await select({ data: { clientId } });
    await router.invalidate();
    await navigate({ to: "/" });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell
        assistant={assistantReleased ? <AssistantPanel /> : null}
        assistantFab={assistantReleased ? <AssistantFab /> : null}
        banner={
          <>
            {sessionBanner}
            {status.hasSource ? null : <DataReadinessBanner />}
          </>
        }
        status={status}
        account={{
          name: user.name,
          access: areaAccessOf(user),
          release,
          onSignOut: () => void signOut(),
          store: activeStore
            ? {
                id: activeStore.id,
                name: activeStore.name,
                isArchived: Boolean(activeStore.archivedAt),
                releasedScreens: activeStore.releasedScreens,
              }
            : null,
          stores: user.stores.map((s) => ({
            id: s.id,
            name: s.name,
            isArchived: Boolean(s.archivedAt),
            releasedScreens: s.releasedScreens,
          })),
          onSelectStore: (id) => void switchStore(id),
        }}
      />
    </QueryClientProvider>
  );
}
