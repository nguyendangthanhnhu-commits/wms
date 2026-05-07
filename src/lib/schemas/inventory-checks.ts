import { z } from "zod";

export const CheckTypeEnum = z.enum(["shift_start", "shift_end", "periodic", "spot_check"]);
export const ShiftEnum = z.enum(["shift_1", "shift_2", "shift_3", "admin"]);

export const CreateInventoryCheckSchema = z.object({
  warehouseId: z.string().uuid(),
  checkType: CheckTypeEnum,
  shift: ShiftEnum.optional(),
  shiftDate: z.string().optional(), // ISO string
  notes: z.string().optional(),
});

export type CreateInventoryCheckInput = z.infer<typeof CreateInventoryCheckSchema>;
export type CreateInventoryCheckFormValues = z.input<typeof CreateInventoryCheckSchema>;

export const PatchInventoryCheckSchema = z.object({
  action: z.enum(["save", "complete"]),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      actualQty: z.coerce.number().nullable(),
      discrepancyReason: z.string().optional(),
    })
  ),
});

export type PatchInventoryCheckInput = z.infer<typeof PatchInventoryCheckSchema>;

