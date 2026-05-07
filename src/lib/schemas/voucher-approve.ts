import { z } from "zod";

export const ApproveVoucherSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().optional(),
});

export type ApproveVoucherInput = z.infer<typeof ApproveVoucherSchema>;

