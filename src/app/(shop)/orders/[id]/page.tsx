import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCustomer } from "@/lib/session";
import { rupees, STATUS_LABEL } from "@/lib/format";
import { reorderLines } from "@/lib/reorder";
import { ReorderButton } from "@/components/reorder-button";
import QRCode from "qrcode";
import { expireUnpaidOrders, MAX_UTR_TRIES, upiLink } from "@/lib/payments";
import { AutoRefresh, UtrForm } from "./utr-form";

const STEPS = ["PLACED", "ACCEPTED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];

export default async function OrderPage(props: PageProps<"/orders/[id]">) {
  const { id } = await props.params;
  const user = await getCustomer();
  if (!user) redirect(`/login?next=/orders/${id}`);

  await expireUnpaidOrders();
  const order = await db.order.findFirst({
    where: { id, userId: user.id },
    include: {
      items: { include: { variant: { include: { product: true } } } },
      address: true,
      slot: true,
      payment: true,
    },
  });
  if (!order) notFound();

  // Paying by UPI: where this order is in the payment
  const pay = order.payment;
  const upi = order.paymentMethod === "ONLINE" && pay ? pay : null;
  const waitingToPay = !!upi && order.status === "PLACED" && upi.status === "PENDING" && !upi.utr;
  const checking = !!upi && order.status === "PLACED" && upi.status === "PENDING" && !!upi.utr;
  const paid = !!upi && upi.status === "PAID";
  const link = waitingToPay ? upiLink(order.number, order.totalPaise) : null;
  const qr = link ? await QRCode.toDataURL(link, { margin: 1, width: 260, errorCorrectionLevel: "M" }) : null;
  const deadline = upi?.payBy?.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const headline = waitingToPay
    ? "Almost there! Please pay to confirm your order."
    : checking
      ? "Thank you! We are checking your payment."
      : order.status === "PLACED"
        ? paid
          ? "Payment received. We will accept your order shortly."
          : "Thank you! We have received your order."
        : STATUS_LABEL[order.status];

  const step = STEPS.indexOf(order.status);
  const { lines, unavailable } = reorderLines(order.items);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-2xl bg-green-50 p-5">
        <h1 className="font-display text-3xl font-medium text-green-950">Order #{order.number}</h1>
        <p className="text-green-800">
          {headline}
        </p>
      </div>

      {(waitingToPay || checking) && <AutoRefresh />}

      {waitingToPay && qr && link && (
        <section className="space-y-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
          <div>
            <h2 className="font-display text-xl font-medium text-green-950">Pay {rupees(order.totalPaise)} by UPI</h2>
            <p className="text-sm text-stone-700">
              Please pay {deadline ? <>by <b>{deadline}</b></> : "within 30 minutes"}, or the order is cancelled
              automatically.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={`UPI QR code to pay ${rupees(order.totalPaise)}`} width={260} height={260} className="rounded-xl bg-white p-2" />
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-stone-700">
              <li>Scan this QR with any UPI app (GPay, PhonePe, Paytm…). The amount is filled in for you.</li>
              <li>
                On your phone? Tap{" "}
                <a href={link} className="font-semibold text-green-800 underline">
                  Pay with UPI app
                </a>
                .
              </li>
              <li>Pay exactly {rupees(order.totalPaise)}, then come back here.</li>
              <li>Enter the 12-digit UTR / reference number below.</li>
            </ol>
          </div>
          {upi && upi.utrAttempts > 0 && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              We could not find that payment in the shop&apos;s account. Please check the reference number and enter it
              again.
            </p>
          )}
          {upi && upi.utrAttempts >= MAX_UTR_TRIES ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              Too many tries. Please call the shop to sort out your payment.
            </p>
          ) : (
            <UtrForm orderId={order.id} triesLeft={MAX_UTR_TRIES - (upi?.utrAttempts ?? 0)} />
          )}
        </section>
      )}

      {checking && upi?.utr && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-stone-700">
          We have your payment reference <b>••••••••{upi.utr.slice(-4)}</b>. The shop is checking its account and will
          accept your order as soon as the money is confirmed. This page updates by itself.
        </section>
      )}

      {order.status !== "CANCELLED" && (
        <ol className="flex justify-between text-center text-xs">
          {STEPS.map((s, i) => (
            <li key={s} className={i <= step ? "font-semibold text-green-700" : "text-stone-400"}>
              <div className={`mx-auto mb-1 h-3 w-3 rounded-full ${i <= step ? "bg-green-600" : "bg-stone-300"}`} />
              {STATUS_LABEL[s]}
            </li>
          ))}
        </ol>
      )}

      <section className="space-y-1 rounded-2xl border border-green-950/10 bg-white p-5 text-sm">
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between">
            <span>
              {i.nameSnap} × {i.qty}
            </span>
            <span>{rupees(i.pricePaise * i.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-2">
          <span>Delivery</span>
          <span>{order.feePaise === 0 ? "Free" : rupees(order.feePaise)}</span>
        </div>
        <div className="flex justify-between text-base font-bold">
          <span>{order.paymentMethod === "COD" ? "Total (pay on delivery)" : "Total"}</span>
          <span>{rupees(order.totalPaise)}</span>
        </div>
        {paid && <p className="font-semibold text-green-700">Paid by UPI ✓</p>}
        {order.status === "CANCELLED" && upi?.status === "PAID" && (
          <p className="rounded-xl bg-amber-50 p-3 text-amber-900">
            This order was cancelled. The shop will refund {rupees(order.totalPaise)} to your UPI account.
          </p>
        )}
        {order.status === "CANCELLED" && upi && upi.status !== "PAID" && upi.status !== "REFUNDED" && !upi.utr && (
          <p className="rounded-xl bg-stone-50 p-3 text-stone-600">
            No payment was received, so nothing was charged. You are welcome to place a new order.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-green-950/10 bg-white p-5 text-sm">
        <p className="font-semibold">Delivering to</p>
        <p>
          {order.address.line1}
          {order.address.landmark ? `, ${order.address.landmark}` : ""}, {order.address.area} -{" "}
          {order.address.pincode}
        </p>
        <p className="mt-2 font-semibold">When</p>
        <p>
          {order.deliveryDate.toLocaleDateString("en-IN")}, {order.slot.label}
        </p>
      </section>

      <ReorderButton lines={lines} unavailable={unavailable} />
    </div>
  );
}
