import type { Prisma } from "@prisma/client";

// ---- India time (UTC+5:30, no daylight saving). The server may run in any time zone, so
// "today" and weekdays are always worked out in IST.
const IST_MS = 5.5 * 3600 * 1000;
const DAY_MS = 86_400_000;

/** Midnight (IST) at the start of the day that contains `d`, as a real moment in time. */
export function istDayStart(d: Date = new Date()): Date {
  return new Date(Math.floor((d.getTime() + IST_MS) / DAY_MS) * DAY_MS - IST_MS);
}
/** "2026-11-24": the IST calendar day of `d`, used to group orders by day. */
export const istDayKey = (d: Date) => new Date(d.getTime() + IST_MS).toISOString().slice(0, 10);
export const daysAgo = (n: number, from: Date = istDayStart()) => new Date(from.getTime() - n * DAY_MS);

export const fmtDateTime = (d: Date | null | undefined) =>
  d
    ? d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })
    : "";
export const fmtDate = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "";

// ---- The groups of orders the owner works through. One definition, used by the dashboard
// counts and by the filter tabs on the Orders screen, so the numbers always agree.
export const ORDER_FILTERS = {
  payment: {
    label: "Check payment",
    where: { status: "PLACED", paymentMethod: "ONLINE", payment: { is: { status: "PENDING", utr: { not: null } } } },
  },
  waiting: {
    label: "Waiting for payment",
    where: { status: "PLACED", paymentMethod: "ONLINE", payment: { is: { status: "PENDING", utr: null } } },
  },
  accept: {
    label: "To accept",
    where: { status: "PLACED", OR: [{ paymentMethod: "COD" }, { payment: { is: { status: "PAID" } } }] },
  },
  active: { label: "In progress", where: { status: { in: ["ACCEPTED", "PACKED", "OUT_FOR_DELIVERY"] } } },
  delivered: { label: "Delivered", where: { status: "DELIVERED" } },
  cancelled: { label: "Cancelled", where: { status: "CANCELLED" } },
  refund: {
    label: "Refunds due",
    where: { status: "CANCELLED", payment: { is: { status: "PAID" } } },
  },
} satisfies Record<string, { label: string; where: Prisma.OrderWhereInput }>;

export type OrderFilterKey = keyof typeof ORDER_FILTERS;
export const isFilterKey = (k: unknown): k is OrderFilterKey => typeof k === "string" && k in ORDER_FILTERS;

// An order counts as sales once its payment is confirmed (UPI) or collected (cash).
export const PAID_ORDER: Prisma.OrderWhereInput = { payment: { is: { status: "PAID" } } };

// 7 -> "7 AM", 13 -> "1 PM", 0 or 24 -> "12 AM". Delivery slot names are made from these.
export function hourLabel(h: number): string {
  const x = h % 24;
  return `${x % 12 || 12} ${x < 12 ? "AM" : "PM"}`;
}
export const slotLabel = (start: number, end: number) => `${hourLabel(start)} - ${hourLabel(end)}`;
