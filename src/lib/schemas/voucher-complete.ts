import { z } from "zod";

export const CompleteVoucherSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        actualQty: z.coerce.number().positive(),
        lotNumber: z.string().optional(),
        note: z.string().optional(),
      })
    )
    .min(1, "Phải có ít nhất 1 dòng hàng"),
});

export type CompleteVoucherInput = z.infer<typeof CompleteVoucherSchema>;

