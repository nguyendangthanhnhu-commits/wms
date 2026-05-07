"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  CheckTypeEnum,
  CreateInventoryCheckSchema,
  type CreateInventoryCheckFormValues,
  type CreateInventoryCheckInput,
  ShiftEnum,
} from "@/lib/schemas/inventory-checks";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";

type Warehouse = { id: string; code: string; name: string; groupType: string };

type Props = {
  warehouses: Warehouse[];
  role: string;
};

export function CheckForm({ warehouses, role }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const allowedWarehouses = useMemo(() => {
    if (role === "warehouse_keeper" || role === "production_staff") {
      return warehouses.filter((w) => w.groupType === "production");
    }
    return warehouses;
  }, [warehouses, role]);

  const form = useForm<CreateInventoryCheckFormValues>({
    resolver: zodResolver(CreateInventoryCheckSchema),
    defaultValues: {
      checkType: "shift_start",
      shift: "admin",
      shiftDate: new Date().toISOString(),
    } as any,
    mode: "onChange",
  });

  async function submit(values: CreateInventoryCheckFormValues) {
    setBusy(true);
    try {
      const parsed: CreateInventoryCheckInput = CreateInventoryCheckSchema.parse(values);
      const res = await fetch("/api/inventory-checks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...parsed,
          shiftDate: parsed.shiftDate ? new Date(parsed.shiftDate).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Không thể tạo phiên kiểm kê", { description: data?.error ?? "Vui lòng thử lại." });
        return;
      }
      toast.success("Đã tạo phiên kiểm kê", { description: data.id });
      router.push(`/inventory-checks/${data.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <PageHeader title="Tạo phiên kiểm kê" description="Tạo phiên và sinh dòng kiểm theo tồn hệ thống" />
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label>Kho</Label>
          <Select
            value={(form.watch("warehouseId") as any) ?? ""}
            onValueChange={(v) => form.setValue("warehouseId" as any, v, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn kho" />
            </SelectTrigger>
            <SelectContent>
              {allowedWarehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.code} — {w.name} <Badge variant="secondary" className="ml-2">{w.groupType}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Loại kiểm kê</Label>
            <Select
              value={(form.watch("checkType") as any) ?? ""}
              onValueChange={(v) => form.setValue("checkType" as any, v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CheckTypeEnum.options.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Ca</Label>
            <Select
              value={(form.watch("shift") as any) ?? ""}
              onValueChange={(v) => form.setValue("shift" as any, v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ShiftEnum.options.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Ngày</Label>
          <Input
            type="date"
            value={form.watch("shiftDate") ? new Date(String(form.watch("shiftDate"))).toISOString().slice(0, 10) : ""}
            onChange={(e) =>
              form.setValue("shiftDate" as any, new Date(e.target.value).toISOString(), { shouldValidate: true })
            }
          />
        </div>

        <div className="grid gap-2">
          <Label>Ghi chú (optional)</Label>
          <Textarea
            value={String(form.watch("notes") ?? "")}
            onChange={(e) => form.setValue("notes" as any, e.target.value || undefined)}
          />
        </div>

        <div className="flex justify-end">
          <Button disabled={busy} onClick={form.handleSubmit((v) => submit(v))}>
            {busy ? "Đang tạo..." : "Tạo phiên"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

