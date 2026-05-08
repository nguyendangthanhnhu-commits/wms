import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  showToolbar?: boolean;
  className?: string;
};

export function TableSkeleton({
  rows = 8,
  columns = 5,
  showToolbar = true,
  className,
}: TableSkeletonProps) {
  return (
    <Card className={className}>
      <CardContent className="space-y-3 p-5">
        {showToolbar ? (
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-9 w-32" />
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border">
          <div className="grid border-b bg-muted/40" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={`h-${i}`} className="px-4 py-3">
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
          {Array.from({ length: rows }).map((_, r) => (
            <div
              key={`r-${r}`}
              className={cn("grid", r % 2 === 1 && "bg-muted/20")}
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}
            >
              {Array.from({ length: columns }).map((_, c) => (
                <div key={`c-${r}-${c}`} className="px-4 py-3">
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
