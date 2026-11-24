-- Manual UPI payment: the customer submits the payment reference (UTR), the owner confirms it
ALTER TABLE "Payment" ADD COLUMN "utr" TEXT;
ALTER TABLE "Payment" ADD COLUMN "utrSubmittedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "utrAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "payBy" TIMESTAMP(3);
CREATE UNIQUE INDEX "Payment_utr_key" ON "Payment"("utr");
