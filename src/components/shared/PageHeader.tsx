import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
  className?: string;
  bordered?: boolean;
};

export function PageHeader({
  title,
  description,
  actions,
  icon: Icon,
  className,
  bordered = false,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        bordered && "border-b pb-4",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold leading-tight tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
