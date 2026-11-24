"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PAY_WINDOW_MIN } from "@/lib/payments";

export async function toggleStock(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const p = await db.product.findUnique({ where: { id } });
  if (!p) return;
  await db.product.update({ where: { id }, data: { inStock: !p.inStock } });
  revalidatePath("/admin/products");
}

export async function setStock(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const inStock = formData.get("inStock") === "1";
  await db.product.update({ where: { id }, data: { inStock } });
  revalidatePath("/admin/products");
}

export async function updatePrice(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const rupees = Number(formData.get("price"));
  if (!Number.isFinite(rupees) || rupees <= 0) return;
  await db.productVariant.update({
    where: { id },
    data: { pricePaise: Math.round(rupees * 100) },
  });
  revalidatePath("/admin/products");
}

const UNITS = ["KG", "GRAM", "PIECE", "PACK", "DOZEN", "LITRE", "BUNCH"] as const;

export async function updateSize(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const quantity = Number(formData.get("quantity"));
  const unit = z.enum(UNITS).safeParse(formData.get("unit"));
  if (!Number.isFinite(quantity) || quantity <= 0 || !unit.success) return;
  await db.productVariant.update({ where: { id }, data: { quantity, unit: unit.data } });
  revalidatePath("/admin/products");
}

const STATUSES = ["PLACED", "ACCEPTED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] as const;

export async function setOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = z.enum(STATUSES).parse(formData.get("status"));
  const order = await db.order.findUnique({ where: { id }, include: { payment: true } });
  if (!order) return;
  // a finished or cancelled order cannot be changed again
  if (order.status === "CANCELLED" || order.status === "DELIVERED") return;
  // UPI orders can only move forward once the money is confirmed in the shop's account
  if (status !== "CANCELLED" && order.paymentMethod === "ONLINE" && order.payment?.status !== "PAID") return;

  await db.order.update({ where: { id }, data: { status } });
  if (status === "DELIVERED" && order.paymentMethod === "COD") {
    await db.payment.updateMany({
      where: { orderId: id, status: "PENDING" },
      data: { status: "PAID" }, // cash collected on delivery
    });
  }
  if (status === "CANCELLED") {
    // a payment that was never confirmed is closed; a confirmed one stays PAID until it is refunded
    await db.payment.updateMany({ where: { orderId: id, status: "PENDING" }, data: { status: "FAILED" } });
  }
  revalidatePath("/admin/orders");
}

// The owner has seen this payment arrive in their own bank / UPI app
export async function confirmPayment(formData: FormData) {
  await requireAdmin();
  const pay = await db.payment.findUnique({ where: { orderId: String(formData.get("id")) }, include: { order: true } });
  if (!pay || pay.status !== "PENDING" || !pay.utr || pay.order.status !== "PLACED") return;
  await db.payment.update({ where: { id: pay.id }, data: { status: "PAID", paidAt: new Date() } });
  revalidatePath("/admin/orders");
}

// The reference the customer typed is not in the owner's account: they may try again, with a fresh 30 minutes
export async function rejectPayment(formData: FormData) {
  await requireAdmin();
  const pay = await db.payment.findUnique({ where: { orderId: String(formData.get("id")) }, include: { order: true } });
  if (!pay || pay.status !== "PENDING" || !pay.utr || pay.order.status !== "PLACED") return;
  await db.payment.update({
    where: { id: pay.id },
    data: { utr: null, utrSubmittedAt: null, payBy: new Date(Date.now() + PAY_WINDOW_MIN * 60_000) },
  });
  revalidatePath("/admin/orders");
}

// A paid order was cancelled and the owner has sent the money back
export async function markRefunded(formData: FormData) {
  await requireAdmin();
  const pay = await db.payment.findUnique({ where: { orderId: String(formData.get("id")) }, include: { order: true } });
  if (!pay || pay.status !== "PAID" || pay.order.status !== "CANCELLED") return;
  await db.payment.update({ where: { id: pay.id }, data: { status: "REFUNDED" } });
  revalidatePath("/admin/orders");
}

const newProduct = z.object({
  nameEn: z.string().trim().min(2),
  nameKn: z.string().trim().optional(),
  categoryId: z.string(),
  unit: z.enum(["KG", "GRAM", "PIECE", "PACK", "DOZEN", "LITRE", "BUNCH"]),
  quantity: z.coerce.number().positive(),
  price: z.coerce.number().positive(),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
});

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const d = newProduct.parse(Object.fromEntries(formData));
  const base = d.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  await db.product.create({
    data: {
      slug,
      nameEn: d.nameEn,
      nameKn: d.nameKn || null,
      imageUrl: d.imageUrl || null,
      categoryId: d.categoryId,
      variants: {
        create: { unit: d.unit, quantity: d.quantity, pricePaise: Math.round(d.price * 100) },
      },
    },
  });
  revalidatePath("/admin/products");
}
