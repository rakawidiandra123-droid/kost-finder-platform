import type { Timestamp } from "@/types";

/** Format a Nat price (in rupiah) as "Rp 1.500.000". */
export function formatPrice(price: bigint): string {
  return `Rp ${price.toLocaleString("id-ID")}`;
}

/** Format a Nat price with the "/ bulan" suffix used across the catalog. */
export function formatMonthlyPrice(price: bigint): string {
  return `${formatPrice(price)} / bulan`;
}

/**
 * Convert a Motoko nanosecond timestamp to a Date.
 * Returns null when the value cannot be represented as a valid date.
 */
export function timestampToDate(timestamp: Timestamp): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Render a backend timestamp as a readable Indonesian date, with a fallback. */
export function formatTimestamp(timestamp: Timestamp): string {
  const date = timestampToDate(timestamp);
  if (!date) return "Tanggal tidak tersedia";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Render an ISO date string (yyyy-mm-dd) as a readable Indonesian date. */
export function formatDateString(value: string): string {
  if (!value) return "Tanggal tidak tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
