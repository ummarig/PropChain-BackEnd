-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'PENDING', 'PROCESSED', 'FAILED');

-- AlterTable: add cancellation fields to transactions
ALTER TABLE "transactions"
  ADD COLUMN "cancellation_reason" TEXT,
  ADD COLUMN "cancelled_by_id"     TEXT,
  ADD COLUMN "cancelled_at"        TIMESTAMP(3),
  ADD COLUMN "refund_amount"       DECIMAL(65,30),
  ADD COLUMN "refund_status"       "RefundStatus" NOT NULL DEFAULT 'NONE';

-- CreateIndex
CREATE INDEX "transactions_refund_status_idx" ON "transactions"("refund_status");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cancelled_by_id_fkey"
  FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
