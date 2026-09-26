import { Outlet, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ScrollShadows } from "@/shared/ui/ScrollShadow";
import { useScrollShadow } from "@/shared/hooks/useScrollShadow";
import { TooltipProvider } from "@/shared/ui/Tooltip";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import { showsPeriod } from "./periodPaths";
import type { ShellAccount, ShellStatus } from "./shellStatus.types";

export function AppShell({
  assistant,
  assistantFab,
  status,
  banner,
  account,
  topBarAction,
}: {
  assistant: ReactNode;
  assistantFab: ReactNode;
  status: ShellStatus;
  banner?: ReactNode;
  topBarAction?: ReactNode;
  account: ShellAccount;
}) {
  const { ref, bottom } = useScrollShadow<HTMLElement>();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAssistant = pathname === "/assistente";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-dvh w-full bg-background">
        <Sidebar status={status} account={account} />
        <div className="flex h-dvh min-w-0 flex-1 flex-col">
          {!isAssistant && (
            <TopBar
              storeName={account.store?.name ?? ""}
              showPeriod={showsPeriod(pathname)}
              action={topBarAction}
            />
          )}
          <div className="relative min-h-0 min-w-0 flex-1">
            <main
              ref={ref}
              id="app-scroll"
              className={
                isAssistant
                  ? "flex h-full min-w-0 flex-col overflow-hidden pb-16 md:pb-0"
                  : "h-full min-w-0 overflow-y-auto pb-20 md:pb-0"
              }
            >
              {banner}
              <Outlet />
              <ScrollShadows bottom={bottom} />
            </main>
          </div>
        </div>
        {!isAssistant && assistant}
        {!isAssistant && assistantFab}
        <BottomNav account={account} status={status} />
      </div>
    </TooltipProvider>
  );
}
