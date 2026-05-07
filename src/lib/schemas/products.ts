import { z } from "zod";

export const ProductTypeEnum = z.enum(["component", "consumable", "tool", "finished_good"]);

export const CreateProductSchema = z.object({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  productType: ProductTypeEnum,
  baseUnitId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  minStockLevel: z.coerce.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  sku: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

