import { z } from "zod";

export const CreateSupplierSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial().extend({
  code: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
});

export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;

