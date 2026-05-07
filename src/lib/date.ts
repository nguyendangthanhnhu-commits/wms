import { format, formatDistanceToNow, formatRelative, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

const TIMEZONE = "Asia/Ho_Chi_Minh";

function toDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  return parseISO(value);
}

export function formatDate(value: Date | string | number, pattern = "dd/MM/yyyy") {
  try {
    return format(toDate(value), pattern, { locale: vi });
  } catch {
    return "";
  }
}

export function formatDateTime(value: Date | string | number) {
  return formatDate(value, "dd/MM/yyyy HH:mm");
}

export function formatTime(value: Date | string | number) {
  return formatDate(value, "HH:mm");
}

export function fromNow(value: Date | string | number) {
  try {
    return formatDistanceToNow(toDate(value), { addSuffix: true, locale: vi });
  } catch {
    return "";
  }
}

export function relative(value: Date | string | number, base: Date = new Date()) {
  try {
    return formatRelative(toDate(value), base, { locale: vi });
  } catch {
    return "";
  }
}

export function formatNumber(value: number | bigint | null | undefined, options?: Intl.NumberFormatOptions) {
  if (value === null || value === undefined) return "";
  try {
    return new Intl.NumberFormat("vi-VN", options).format(value as number);
  } catch {
    return String(value);
  }
}

export function formatCurrency(value: number | bigint | null | undefined, currency = "VND") {
  return formatNumber(value, { style: "currency", currency, maximumFractionDigits: 0 });
}

export const DATE_TIMEZONE = TIMEZONE;
