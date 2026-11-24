import "server-only";
import { db } from "./db";

// How long a customer has to pay after placing an order
export const PAY_WINDOW_MIN = 30;
// How many times a customer may enter a payment reference for one order
export const MAX_UTR_TRIES = 3;

export const payDeadline = () => new Date(Date.now() + PAY_WINDOW_MIN * 60_000);

// The shop's UPI details come from .env. Without them the shop cannot take orders.
export function upiConfig() {
  const vpa = process.env.SHOP_UPI_ID?.trim();
  if (!vpa) return null;
  return { vpa, name: process.env.SHOP_UPI_NAME?.trim() || "Mangalore Stores" };
}

// The link behind the QR code. UPI apps open it with the amount and note already filled in.
export function upiLink(orderNumber: number, amountPaise: number) {
  const c = upiConfig();
  if (!c) return null;
  const enc = (v: string) => encodeURIComponent(v).replace(/%40/g, "@");
  return (
    `upi://pay?pa=${enc(c.vpa)}&pn=${encodeURIComponent(c.name)}` +
    `&am=${(amountPaise / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${orderNumber}`)}`
  );
}

// Cancels orders whose payment deadline passed without any payment reference. It runs
// whenever an order page is opened, so no timer or background job is needed.
export async function expireUnpaidOrders() {
  const stale = await db.payment.findMany({
    where: {
      status: "PENDING",
      utr: null,
      payBy: { lt: new Date() },
      order: { paymentMethod: "ONLINE", status: "PLACED" },
    },
    select: { id: true, orderId: true },
  });
  if (stale.length === 0) return 0;
  await db.$transaction([
    db.order.updateMany({
      where: { id: { in: stale.map((p) => p.orderId) }, status: "PLACED" },
      data: { status: "CANCELLED" },
    }),
    // only payments that are still unpaid and have no reference: one submitted a moment ago is kept
    db.payment.updateMany({
      where: { id: { in: stale.map((p) => p.id) }, status: "PENDING", utr: null },
      data: { status: "FAILED" },
    }),
  ]);
  return stale.length;
}
