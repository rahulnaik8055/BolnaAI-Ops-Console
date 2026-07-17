-- AlterTable: Add priceBreakdown to CallExecution
ALTER TABLE "CallExecution" ADD COLUMN "priceBreakdown" TEXT;

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "status" TEXT,
    "billingSettled" BOOLEAN,
    "totalCost" DOUBLE PRECISION,
    "costBreakdown" TEXT,
    "priceBreakdown" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPayload" TEXT NOT NULL,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebhookEvent_executionId_idx" ON "WebhookEvent"("executionId");

-- CreateIndex
CREATE INDEX "WebhookEvent_receivedAt_idx" ON "WebhookEvent"("receivedAt");

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "CallExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
