import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { radiusClass } from "@/shared/styles/radius";
import { shadowClass } from "@/shared/styles/shadows";
import { textClass } from "@/shared/styles/typography";

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh-48px)] flex-col border-t border-border bg-card pb-[env(safe-area-inset-bottom)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom",
            "rounded-t-lg",
            shadowClass.lg,
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <DialogPrimitive.Title className={cn(textClass.cardTitle, "text-foreground")}>
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description
                  className={cn(textClass.meta, "mt-1 text-muted-foreground")}
                >
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">
                  {title}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground",
                radiusClass.control,
              )}
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
