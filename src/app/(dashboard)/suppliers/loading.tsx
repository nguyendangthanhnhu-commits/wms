import { TableSkeleton } from "@/components/shared/TableSkeleton";

export default function SuppliersLoading() {
  return <TableSkeleton rows={8} columns={6} />;
}
