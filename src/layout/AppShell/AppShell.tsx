import { Outlet, useRouterState } from "@tanstack/react-router";
import { ScrollShadows, useScrollShadow } from "@/design-system/patterns/ScrollShadow";
import { TooltipProvider } from "@/design-system/primitives/Tooltip";
import { Sidebar } from "../Sidebar";
import { BottomNav } from "../BottomNav";
import { AssistantPanel } from "../AssistantPanel";
import { AssistantFab } from "../AssistantFab";

/** App shell: sidebar, scrollable content area, assistant and bottom nav. */
export function AppShell() {
  const { ref, top, bottom } = useScrollShadow<HTMLElement>();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAssistant = pathname === "/assistente";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-dvh w-full bg-background">
        <Sidebar />
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
        {!isAssistant && <AssistantPanel />}
        {!isAssistant && <AssistantFab />}
        <BottomNav />
      </div>
    </TooltipProvider>
  );
}
