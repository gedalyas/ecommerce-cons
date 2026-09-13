-- CreateEnum
CREATE TYPE "influencer_status" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "influencer_rule_type" AS ENUM ('FIXED', 'DAILY', 'WEEKLY', 'MONTHLY', 'PER_ORDER', 'PERCENT_OF_PRODUCTS', 'PERCENT_OF_TOTAL');

-- CreateTable
CREATE TABLE "influencer" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT,
    "status" "influencer_status" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "influencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "influencer_rule" (
    "id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "type" "influencer_rule_type" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "cap" DECIMAL(12,2),
    "notes" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "influencer_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "influencer_coupon" (
    "id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active_from" DATE,
    "active_until" DATE,

    CONSTRAINT "influencer_coupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "influencer_client_id_status_idx" ON "influencer"("client_id", "status");

-- CreateIndex
CREATE INDEX "influencer_rule_influencer_id_idx" ON "influencer_rule"("influencer_id");

-- CreateIndex
CREATE INDEX "influencer_coupon_influencer_id_idx" ON "influencer_coupon"("influencer_id");

-- AddForeignKey
ALTER TABLE "influencer" ADD CONSTRAINT "influencer_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencer_rule" ADD CONSTRAINT "influencer_rule_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencer_coupon" ADD CONSTRAINT "influencer_coupon_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
