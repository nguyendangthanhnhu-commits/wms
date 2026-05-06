import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BomLoading() {
  return (
    <Card>
      <CardContent className="space-y-2 p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[240px] w-full" />
      </CardContent>
    </Card>
  );
}

