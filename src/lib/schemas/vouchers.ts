import { z } from "zod";

export const VoucherTypeEnum = z.enum(["PN", "PX_YC", "PX", "PCT", "PNT", "PXT", "PBL", "PQC"]);
export const ShiftEnum = z.enum(["shift_1", "shift_2", "shift_3", "admin"]);

export const CreateVoucherSchema = z.object({
  voucherType: VoucherTypeEnum,
  fromWarehouseId: z.string().uuid().optional(),
  toWarehouseId: z.string().uuid().optional(),
  salesOrderId: z.string().uuid().optional(),
  shift: ShiftEnum.optional(),
  shiftDate: z.string().optional(), // ISO string from client
  vehicleInfo: z.string().optional(),
  driverName: z.string().optional(),
  receiverName: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        unitId: z.string().uuid(),
        plannedQty: z.coerce.number().positive(),
        lotNumber: z.string().optional(),
        note: z.string().optional(),
      })
    )
    .min(1, "Phải có ít nhất 1 sản phẩm"),
});

export type CreateVoucherInput = z.infer<typeof CreateVoucherSchema>;
export type CreateVoucherFormValues = z.input<typeof CreateVoucherSchema>;

