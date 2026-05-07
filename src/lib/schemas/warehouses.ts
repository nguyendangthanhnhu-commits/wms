import { z } from "zod";

export const WarehouseGroupEnum = z.enum(["component", "finished_good", "production", "quality", "defect"]);

export const CreateWarehouseSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  groupType: WarehouseGroupEnum,
  description: z.string().optional(),
  capacity: z.coerce.number().optional(),
  managerId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const UpdateWarehouseSchema = CreateWarehouseSchema.partial().extend({
  code: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
});

export type CreateWarehouseInput = z.infer<typeof CreateWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof UpdateWarehouseSchema>;

