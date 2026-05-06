import { format } from "date-fns";

export function generateVoucherCode(prefix: string) {
  const stamp = format(new Date(), "yyyyMMddHHmmss");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}
