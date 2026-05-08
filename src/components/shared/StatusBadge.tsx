import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  className?: string;
  kind?: "auto" | "voucher" | "order" | "inventory-check" | "defect" | "role";
};

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary ring-1 ring-inset ring-primary/30",
  success:
    "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/30 dark:text-emerald-300",
  warning:
    "bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/30 dark:text-amber-300",
  danger:
    "bg-rose-500/10 text-rose-700 ring-1 ring-inset ring-rose-500/30 dark:text-rose-300",
  info: "bg-sky-500/10 text-sky-700 ring-1 ring-inset ring-sky-500/30 dark:text-sky-300",
};

const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Nháp", tone: "neutral" },
  pending: { label: "Chờ", tone: "warning" },
  pending_approval: { label: "Chờ duyệt", tone: "warning" },
  pending_qc: { label: "Chờ QC", tone: "warning" },
  in_progress: { label: "Đang xử lý", tone: "info" },
  processing: { label: "Đang xử lý", tone: "info" },
  open: { label: "Mở", tone: "info" },
  approved: { label: "Đã duyệt", tone: "primary" },
  completed: { label: "Hoàn thành", tone: "success" },
  evaluated: { label: "Đã đánh giá", tone: "success" },
  done: { label: "Hoàn thành", tone: "success" },
  rejected: { label: "Từ chối", tone: "danger" },
  cancelled: { label: "Huỷ", tone: "danger" },
  canceled: { label: "Huỷ", tone: "danger" },
  failed: { label: "Lỗi", tone: "danger" },
  return_supplier: { label: "Trả NCC", tone: "info" },
  destroy: { label: "Huỷ bỏ", tone: "danger" },
  repair_reuse: { label: "Sửa tái dùng", tone: "warning" },
  original: { label: "Lỗi NCC", tone: "info" },
  production: { label: "Lỗi SX", tone: "warning" },
};

const ROLE_MAP: Record<string, { label: string; tone: Tone }> = {
  admin: { label: "Quản trị", tone: "primary" },
  warehouse_manager: { label: "Quản lý kho", tone: "info" },
  warehouse_keeper: { label: "Thủ kho", tone: "info" },
  qc_officer: { label: "Nhân viên QC", tone: "warning" },
  production_staff: { label: "Sản xuất", tone: "neutral" },
  order_clerk: { label: "Đơn hàng", tone: "neutral" },
  staff: { label: "Nhân viên", tone: "neutral" },
};

function fallbackTone(status: string): Tone {
  const s = status.toLowerCase();
  if (s.includes("complete") || s.includes("approve") || s.includes("done") || s.includes("evaluat"))
    return "success";
  if (s.includes("pending") || s.includes("draft") || s.includes("wait")) return "warning";
  if (s.includes("progress") || s.includes("process")) return "info";
  if (s.includes("reject") || s.includes("cancel") || s.includes("fail")) return "danger";
  return "neutral";
}

export function StatusBadge({ status, className, kind = "auto" }: StatusBadgeProps) {
  const key = String(status ?? "").trim().toLowerCase();
  if (!key) return null;

  const lookup = kind === "role" ? ROLE_MAP : kind === "auto" ? { ...ROLE_MAP, ...STATUS_MAP } : STATUS_MAP;
  const found = lookup[key];

  const tone = found?.tone ?? fallbackTone(key);
  const label = found?.label ?? key.replace(/_/g, " ");

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium capitalize",
        TONE_CLASS[tone],
        className
      )}
    >
      {label}
    </Badge>
  );
}
