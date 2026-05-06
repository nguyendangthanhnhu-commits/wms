import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function VouchersLoading() {
  return (
    <Card>
      <CardContent className="space-y-2 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[280px] w-full" />
      </CardContent>
    </Card>
  );
}
