"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  CreateVoucherSchema,
  type CreateVoucherFormValues,
  type CreateVoucherInput,
  VoucherTypeEnum,
  ShiftEnum,
} from "@/lib/schemas/vouchers";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExcelImport, type ImportRow, type TemplateColumn } from "@/components/shared/ExcelImport";

type Warehouse = { id: string; code: string; name: string; groupType: string };
type Product = { id: string; sku: string; name: string; baseUnitId: string; baseUnitCode: string };
type SalesOrder = { id: string; orderCode: string; customerName: string };
type Whitelist = { warehouseId: string; productId: string };

type Props = {
  warehouses: Warehouse[];
  products: Product[];
  salesOrders: SalesOrder[];
  whitelist: Whitelist[];
};

const voucherTypeLabels: Record<CreateVoucherInput["voucherType"], string> = {
  PN: "Nhập kho linh kiện",
  PX_YC: "Yêu cầu xuất",
  PX: "Xuất kho linh kiện",
  PCT: "Chuyển kho nội bộ",
  PNT: "Nhập thành phẩm",
  PXT: "Xuất thành phẩm",
  PBL: "Báo lỗi",
  PQC: "QC đánh giá",
};

function allowedWarehousesByType(type: CreateVoucherInput["voucherType"], warehouses: Warehouse[]) {
  const byGroup = (g: string) => warehouses.filter((w) => w.groupType === g);
  const all = warehouses;

  switch (type) {
    case "PN":
      return { from: [], to: byGroup("component"), toOptional: false };
    case "PX_YC":
      return { from: byGroup("production"), to: byGroup("component"), toOptional: false };
    case "PX":
      return { from: byGroup("component"), to: byGroup("production"), toOptional: false };
    case "PCT":
      return { from: byGroup("production"), to: byGroup("production"), toOptional: false };
    case "PNT":
      return { from: byGroup("production"), to: byGroup("finished_good"), toOptional: false };
    case "PXT":
      return { from: byGroup("finished_good"), to: [], toOptional: true };
    case "PBL":
      return { from: all, to: byGroup("quality"), toOptional: false };
    case "PQC":
      return { from: byGroup("quality"), to: byGroup("defect"), toOptional: false };
  }
}

export function VoucherForm({ warehouses, products, salesOrders, whitelist }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pnMode, setPnMode] = useState<"manual" | "import">("manual");

  const form = useForm<CreateVoucherFormValues>({
    resolver: zodResolver(CreateVoucherSchema),
    defaultValues: {
      voucherType: "PN",
      items: [{ productId: "", unitId: "", plannedQty: 1 }],
    } as any,
    mode: "onChange",
  });

  const voucherType = form.watch("voucherType");
  const fromWarehouseId = form.watch("fromWarehouseId");
  const toWarehouseId = form.watch("toWarehouseId");

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const whitelistedProductIds = useMemo(() => {
    const wid = (fromWarehouseId || toWarehouseId) ?? "";
    if (!wid) return null;
    const wh = whitelist.filter((x) => x.warehouseId === wid);
    return new Set(wh.map((x) => x.productId));
  }, [fromWarehouseId, toWarehouseId, whitelist]);

  const allowedProducts = useMemo(() => {
    const fromWh = warehouses.find((w) => w.id === fromWarehouseId);
    const toWh = warehouses.find((w) => w.id === toWarehouseId);
    const isProduction = fromWh?.groupType === "production" || toWh?.groupType === "production";
    if (!isProduction) return products;
    if (!whitelistedProductIds) return products;
    return products.filter((p) => whitelistedProductIds.has(p.id));
  }, [fromWarehouseId, toWarehouseId, products, warehouses, whitelistedProductIds]);

  const allowedWarehouses = useMemo(() => allowedWarehousesByType(voucherType, warehouses), [voucherType, warehouses]);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const productBySku = useMemo(() => new Map(products.map((p) => [p.sku.toLowerCase(), p])), [products]);

  const pnTemplateColumns: TemplateColumn[] = useMemo(
    () => [
      { key: "sku", label: "SKU sản phẩm", required: true },
      { key: "quantity", label: "Số lượng", required: true },
      { key: "unit", label: "Đơn vị", required: true },
      { key: "lotNumber", label: "Số lô", required: false },
      { key: "manufactureDate", label: "Ngày SX", required: false },
      { key: "expiryDate", label: "Hạn dùng", required: false },
      { key: "note", label: "Ghi chú", required: false },
    ],
    []
  );

  function applyPnImport(rows: ImportRow[]) {
    const nextItems: Array<{ productId: string; unitId: string; plannedQty: number; lotNumber?: string; note?: string }> = [];
    const errors: string[] = [];

    rows.forEach((r, idx) => {
      const sku = String(r.sku ?? "").trim();
      const qtyRaw = r.quantity;
      const unit = String(r.unit ?? "").trim();
      const lotNumber = String(r.lotNumber ?? "").trim();
      const note = String(r.note ?? "").trim();

      const p = productBySku.get(sku.toLowerCase());
      if (!p) errors.push(`Dòng ${idx + 2}: SKU không tồn tại: "${sku}"`);

      const qty = typeof qtyRaw === "number" ? qtyRaw : Number(String(qtyRaw ?? "").trim());
      if (!Number.isFinite(qty) || qty <= 0) errors.push(`Dòng ${idx + 2}: Số lượng không hợp lệ`);

      if (p && unit && unit !== p.baseUnitCode) {
        errors.push(`Dòng ${idx + 2}: Đơn vị "${unit}" không khớp ĐVT gốc (${p.baseUnitCode})`);
      }

      if (p && Number.isFinite(qty) && qty > 0) {
        nextItems.push({
          productId: p.id,
          unitId: p.baseUnitId,
          plannedQty: qty,
          ...(lotNumber ? { lotNumber } : {}),
          ...(note ? { note } : {}),
        });
      }
    });

    if (errors.length) {
      toast.error("Import có lỗi", { description: errors.slice(0, 3).join(" | ") });
      return;
    }

    // replace field array
    remove();
    nextItems.forEach((it) => append(it as any));
    toast.success("Đã import dữ liệu từ Excel", { description: `${nextItems.length} dòng` });
  }

  async function submit(values: CreateVoucherFormValues) {
    setSubmitting(true);
    try {
      const parsed = CreateVoucherSchema.parse(values);
      const payload: CreateVoucherInput = {
        ...parsed,
        shiftDate: parsed.shiftDate ? new Date(parsed.shiftDate).toISOString() : undefined,
      };

      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Tạo phiếu thất bại", {
          description: data?.error ? "Vui lòng kiểm tra dữ liệu nhập." : "Lỗi hệ thống.",
        });
        return;
      }

      toast.success("Tạo phiếu thành công", { description: data.voucherCode });
      router.push(`/vouchers/${data.id}`);
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  function goNext() {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  }

  function goBack() {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  }

  return (
    <Card>
      <CardHeader>
        <PageHeader
          title="Tạo phiếu kho"
          description="3 bước: loại phiếu → thông tin chung → sản phẩm"
          actions={<Badge variant="secondary">Bước {step}/3</Badge>}
        />
      </CardHeader>
      <CardContent className="grid gap-4">
        {step === 1 ? (
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Loại phiếu</Label>
              <Select
                value={voucherType}
                onValueChange={(v) => {
                  form.setValue("voucherType", v as any, { shouldValidate: true });
                  // reset header fields when changing type
                  form.setValue("fromWarehouseId", undefined);
                  form.setValue("toWarehouseId", undefined);
                  form.setValue("salesOrderId", undefined);
                  form.setValue("vehicleInfo", undefined);
                  form.setValue("driverName", undefined);
                  form.setValue("receiverName", undefined);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VoucherTypeEnum.options.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t} — {voucherTypeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Từ kho</Label>
                <Select
                  value={fromWarehouseId ?? ""}
                  onValueChange={(v) => form.setValue("fromWarehouseId", v || undefined, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={allowedWarehouses.from.length ? "Chọn kho" : "Không bắt buộc"} />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedWarehouses.from.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.code} — {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Đến kho</Label>
                <Select
                  value={toWarehouseId ?? ""}
                  onValueChange={(v) => form.setValue("toWarehouseId", v || undefined, { shouldValidate: true })}
                  disabled={!allowedWarehouses.to.length && allowedWarehouses.toOptional}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={allowedWarehouses.toOptional ? "Đối tác (không chọn kho)" : "Chọn kho"} />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedWarehouses.to.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.code} — {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Đơn hàng (optional)</Label>
                <Select
                  value={form.watch("salesOrderId") ?? ""}
                  onValueChange={(v) => form.setValue("salesOrderId", v || undefined, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn hàng confirmed" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesOrders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.orderCode} — {o.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Ca</Label>
                <Select
                  value={form.watch("shift") ?? ""}
                  onValueChange={(v) => form.setValue("shift", (v || undefined) as any, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ca" />
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
              <Label>Ngày ca (optional)</Label>
              <Input
                type="date"
                value={form.watch("shiftDate") ?? ""}
                onChange={(e) => form.setValue("shiftDate", e.target.value || undefined, { shouldValidate: true })}
              />
              <div className="text-xs text-muted-foreground">Nếu bỏ trống, hệ thống sẽ không ghi shiftDate.</div>
            </div>

            {voucherType === "PXT" ? (
              <div className="grid gap-2 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Thông tin xe</Label>
                  <Input
                    value={form.watch("vehicleInfo") ?? ""}
                    onChange={(e) => form.setValue("vehicleInfo", e.target.value || undefined)}
                    placeholder="VD: 51C-123.45"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tài xế</Label>
                  <Input
                    value={form.watch("driverName") ?? ""}
                    onChange={(e) => form.setValue("driverName", e.target.value || undefined)}
                    placeholder="Tên tài xế"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Người nhận</Label>
                  <Input
                    value={form.watch("receiverName") ?? ""}
                    onChange={(e) => form.setValue("receiverName", e.target.value || undefined)}
                    placeholder="Tên người nhận"
                  />
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={form.watch("notes") ?? ""}
                onChange={(e) => form.setValue("notes", e.target.value || undefined)}
                placeholder="Nhập ghi chú..."
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-3">
            {voucherType === "PN" ? (
              <Tabs value={pnMode} onValueChange={(v) => setPnMode(v as any)}>
                <TabsList className="w-fit">
                  <TabsTrigger value="manual">Nhập thủ công</TabsTrigger>
                  <TabsTrigger value="import">Import Excel</TabsTrigger>
                </TabsList>
                <TabsContent value="import" className="mt-3">
                  <ExcelImport templateColumns={pnTemplateColumns} onImport={applyPnImport} />
                </TabsContent>
                <TabsContent value="manual" className="mt-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Danh sách sản phẩm</div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => append({ productId: "", unitId: "", plannedQty: 1 } as any)}
                    >
                      + Thêm dòng
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {fields.map((f, idx) => {
                      const productId = form.watch(`items.${idx}.productId` as const);
                      const p = productId ? productById.get(productId) : undefined;
                      const unitText = p ? p.baseUnitCode : "-";

                      return (
                        <Card key={f.id} className="border-dashed">
                          <CardContent className="grid gap-3 p-4">
                            <div className="grid gap-2 md:grid-cols-3">
                              <div className="grid gap-2 md:col-span-2">
                                <Label>Sản phẩm</Label>
                                <Select
                                  value={productId ?? ""}
                                  onValueChange={(v) => {
                                    const prod = productById.get(v);
                                    update(idx, {
                                      ...(form.getValues(`items.${idx}` as const) as any),
                                      productId: v,
                                      unitId: prod?.baseUnitId ?? "",
                                    } as any);
                                    form.trigger(`items.${idx}` as any);
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Chọn sản phẩm" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allowedProducts.map((x) => (
                                      <SelectItem key={x.id} value={x.id}>
                                        {x.sku} — {x.name} ({x.baseUnitCode})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="grid gap-2">
                                <Label>Số lượng (ĐVT: {unitText})</Label>
                                {(() => {
                                  const plannedQty = form.watch(`items.${idx}.plannedQty` as const) as unknown as
                                    | number
                                    | undefined;
                                  return (
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={plannedQty ?? ""}
                                      onChange={(e) =>
                                        form.setValue(`items.${idx}.plannedQty` as const, Number(e.target.value), {
                                          shouldValidate: true,
                                        })
                                      }
                                    />
                                  );
                                })()}
                              </div>
                            </div>

                            <div className="grid gap-2 md:grid-cols-2">
                              <div className="grid gap-2">
                                <Label>Lot (optional)</Label>
                                <Input
                                  value={form.watch(`items.${idx}.lotNumber` as const) ?? ""}
                                  onChange={(e) =>
                                    form.setValue(`items.${idx}.lotNumber` as const, e.target.value || undefined)
                                  }
                                  placeholder="VD: LOT-2026-0001"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Ghi chú dòng (optional)</Label>
                                <Input
                                  value={form.watch(`items.${idx}.note` as const) ?? ""}
                                  onChange={(e) => form.setValue(`items.${idx}.note` as const, e.target.value || undefined)}
                                  placeholder="Ghi chú..."
                                />
                              </div>
                            </div>

                            <Separator />
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => remove(idx)}
                                disabled={fields.length <= 1}
                              >
                                Xóa dòng
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Danh sách sản phẩm</div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => append({ productId: "", unitId: "", plannedQty: 1 } as any)}
                  >
                    + Thêm dòng
                  </Button>
                </div>

                <div className="grid gap-3">
                  {fields.map((f, idx) => {
                    const productId = form.watch(`items.${idx}.productId` as const);
                    const p = productId ? productById.get(productId) : undefined;
                    const unitText = p ? p.baseUnitCode : "-";

                    return (
                      <Card key={f.id} className="border-dashed">
                        <CardContent className="grid gap-3 p-4">
                          <div className="grid gap-2 md:grid-cols-3">
                            <div className="grid gap-2 md:col-span-2">
                              <Label>Sản phẩm</Label>
                              <Select
                                value={productId ?? ""}
                                onValueChange={(v) => {
                                  const prod = productById.get(v);
                                  update(idx, {
                                    ...(form.getValues(`items.${idx}` as const) as any),
                                    productId: v,
                                    unitId: prod?.baseUnitId ?? "",
                                  } as any);
                                  form.trigger(`items.${idx}` as any);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn sản phẩm" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allowedProducts.map((x) => (
                                    <SelectItem key={x.id} value={x.id}>
                                      {x.sku} — {x.name} ({x.baseUnitCode})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid gap-2">
                              <Label>Số lượng (ĐVT: {unitText})</Label>
                              {(() => {
                                const plannedQty = form.watch(`items.${idx}.plannedQty` as const) as unknown as
                                  | number
                                  | undefined;
                                return (
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={plannedQty ?? ""}
                                    onChange={(e) =>
                                      form.setValue(`items.${idx}.plannedQty` as const, Number(e.target.value), {
                                        shouldValidate: true,
                                      })
                                    }
                                  />
                                );
                              })()}
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-2">
                            <div className="grid gap-2">
                              <Label>Lot (optional)</Label>
                              <Input
                                value={form.watch(`items.${idx}.lotNumber` as const) ?? ""}
                                onChange={(e) =>
                                  form.setValue(`items.${idx}.lotNumber` as const, e.target.value || undefined)
                                }
                                placeholder="VD: LOT-2026-0001"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Ghi chú dòng (optional)</Label>
                              <Input
                                value={form.watch(`items.${idx}.note` as const) ?? ""}
                                onChange={(e) => form.setValue(`items.${idx}.note` as const, e.target.value || undefined)}
                                placeholder="Ghi chú..."
                              />
                            </div>
                          </div>

                          <Separator />
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => remove(idx)}
                              disabled={fields.length <= 1}
                            >
                              Xóa dòng
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : null}

        <Separator />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={goBack} disabled={step === 1}>
              Quay lại
            </Button>
            <Button type="button" variant="secondary" onClick={goNext} disabled={step === 3}>
              Tiếp
            </Button>
          </div>

          <Button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={step !== 3 || submitting}
          >
            {submitting ? "Đang tạo..." : "Tạo phiếu (pending)"}
          </Button>
        </div>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận tạo phiếu</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground">
              Phiếu sẽ được tạo với trạng thái <Badge variant="secondary">pending</Badge> để chờ duyệt.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
                Hủy
              </Button>
              <Button onClick={form.handleSubmit((v) => submit(v))} disabled={submitting}>
                Tạo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

