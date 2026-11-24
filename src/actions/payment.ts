"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCustomer } from "@/lib/session";
import { expireUnpaidOrders, MAX_UTR_TRIES } from "@/lib/payments";

export type UtrState = { error?: string; ok?: boolean };

// The customer types the reference number of the UPI payment they just made. The owner then
// checks it in their own bank / UPI app before accepting the order.
export async function submitUtr(_prev: UtrState, formData: FormData): Promise<UtrState> {
  const user = await getCustomer();
  if (!user) return { error: "Please log in again." };

  const orderId = String(formData.get("orderId") ?? "");
  const utr = String(formData.get("utr") ?? "").replace(/\s+/g, "");
  if (!/^\d{12}$/.test(utr)) {
    return { error: "The UTR / reference number is 12 digits. Please copy it from your payment app." };
  }

  await expireUnpaidOrders();
  const order = await db.order.findFirst({
    where: { id: orderId, userId: user.id, paymentMethod: "ONLINE" },
    include: { payment: true },
  });
  const pay = order?.payment;
  if (!order || !pay) return { error: "Order not found." };
  if (order.status === "CANCELLED") {
    return { error: "This order was cancelled because the payment did not arrive in time. Please place a new order." };
  }
  if (pay.status === "PAID") return { error: "This order is already paid." };
  if (pay.utr) return { error: "We already have your payment reference and are checking it." };
  if (pay.utrAttempts >= MAX_UTR_TRIES) {
    return { error: "Too many tries. Please call the shop to sort out your payment." };
  }

  try {
    // only succeeds while no reference is saved yet, so two quick taps cannot both go through
    const done = await db.payment.updateMany({
      where: { id: pay.id, utr: null, status: "PENDING" },
      data: { utr, utrSubmittedAt: new Date(), utrAttempts: { increment: 1 } },
    });
    if (done.count === 0) return { error: "We already have your payment reference and are checking it." };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "This reference number was already used for another order. Please check it." };
    }
    return { error: "Could not save your reference. Please try again." };
  }
  revalidatePath(`/orders/${order.id}`);
  return { ok: true };
}
