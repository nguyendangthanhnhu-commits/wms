import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  danger: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
  info: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
};

export type StatCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  href?: string;
  delta?: { value: number; positiveIsGood?: boolean };
  className?: string;
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  href,
  delta,
  className,
}: StatCardProps) {
  const formatted =
    typeof value === "number" ? new Intl.NumberFormat("vi-VN").format(value) : value;

  const inner = (
    <Card
      className={cn(
        "group relative overflow-hidden transition-shadow hover:shadow-md",
        href && "cursor-pointer",
        className
      )}
    >
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 truncate text-2xl font-semibold tabular-nums">{formatted}</div>
          {hint ? (
            <div className="mt-1 truncate text-xs text-muted-foreground">{hint}</div>
          ) : null}
          {delta ? (
            <div
              className={cn(
                "mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                (delta.positiveIsGood ?? true)
                  ? delta.value >= 0
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-rose-500/10 text-rose-600"
                  : delta.value >= 0
                    ? "bg-rose-500/10 text-rose-600"
                    : "bg-emerald-500/10 text-emerald-600"
              )}
            >
              {delta.value >= 0 ? "▲" : "▼"} {Math.abs(delta.value)}%
            </div>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-lg",
              TONE_CLASS[tone]
            )}
          >
            <Icon className="size-5" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none">
        {inner}
      </Link>
    );
  }
  return inner;
}
