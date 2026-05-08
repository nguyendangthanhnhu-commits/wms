import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function Section({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: SectionProps) {
  return (
    <section className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)}>
      {(title || description || actions) && (
        <header className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title ? (
              <div className="truncate text-sm font-semibold leading-none tracking-tight">{title}</div>
            ) : null}
            {description ? (
              <div className="mt-1 text-xs text-muted-foreground">{description}</div>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </section>
  );
}
