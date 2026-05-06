import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function WarehousesLoading() {
  return (
    <Card>
      <CardContent className="space-y-2 p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[260px] w-full" />
      </CardContent>
    </Card>
  );
}

