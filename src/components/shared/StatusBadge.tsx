import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const variant =
    normalized.includes("approved") || normalized.includes("completed")
      ? "default"
      : normalized.includes("pending") || normalized.includes("draft")
        ? "secondary"
        : normalized.includes("reject") || normalized.includes("cancel")
          ? "destructive"
          : "outline";

  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {status}
    </Badge>
  );
}
