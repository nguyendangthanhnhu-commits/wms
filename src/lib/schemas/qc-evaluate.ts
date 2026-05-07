import { z } from "zod";

const DefectTypeEnum = z.enum(["original", "production"]);
const ResolutionEnum = z.enum(["return_supplier", "destroy", "repair_reuse", "pending"]);

export const QcEvaluateSchema = z
  .object({
    defectType: DefectTypeEnum,
    supplierId: z.string().uuid().optional(),
    lotNumber: z.string().optional(),
    receivedDate: z.string().optional(),
    responsibleWarehouseId: z.string().uuid().optional(),
    responsibleUserId: z.string().uuid().optional(),
    resolution: ResolutionEnum,
    qcNotes: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.qcNotes || !val.qcNotes.trim()) {
      ctx.addIssue({ code: "custom", message: "Ghi chú QC là bắt buộc", path: ["qcNotes"] });
    }

    if (val.defectType === "production") {
      if (!val.responsibleWarehouseId) {
        ctx.addIssue({ code: "custom", message: "Bắt buộc chọn kho/khâu chịu trách nhiệm", path: ["responsibleWarehouseId"] });
      }
      if (!val.responsibleUserId) {
        ctx.addIssue({ code: "custom", message: "Bắt buộc chọn nhân viên chịu trách nhiệm", path: ["responsibleUserId"] });
      }
    }

    if (val.defectType === "original") {
      if (!val.supplierId) {
        ctx.addIssue({ code: "custom", message: "Bắt buộc chọn nhà cung cấp", path: ["supplierId"] });
      }
    }
  });

export type QcEvaluateInput = z.infer<typeof QcEvaluateSchema>;

