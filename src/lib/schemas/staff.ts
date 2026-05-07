import { z } from "zod";

export const UserRoleEnum = z.enum([
  "admin",
  "warehouse_manager",
  "warehouse_keeper",
  "qc_officer",
  "production_staff",
  "forklift_driver",
  "sales",
  "leader",
]);

export const CreateStaffSchema = z.object({
  employeeCode: z.string().trim().min(1),
  fullName: z.string().trim().min(1),
  role: UserRoleEnum,
  departmentId: z.string().uuid().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateStaffSchema = CreateStaffSchema.partial().extend({
  employeeCode: z.string().trim().min(1).optional(),
  fullName: z.string().trim().min(1).optional(),
});

export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;
export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;

