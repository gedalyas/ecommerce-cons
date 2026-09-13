-- CreateEnum
CREATE TYPE "guru_webhook_kind" AS ENUM ('SELL', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "subscription_source" AS ENUM ('GURU', 'MANUAL');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "contract_status" AS ENUM ('PENDING', 'SIGNED', 'REFUSED', 'DELETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "guru_webhook" (
    "id" TEXT NOT NULL,
    "guru_id" TEXT NOT NULL,
    "kind" "guru_webhook_kind" NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "invoice_status" TEXT,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guru_webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "client_id" TEXT,
    "source" "subscription_source" NOT NULL,
    "status" "subscription_status" NOT NULL,
    "guru_subscription_id" TEXT,
    "plan_name" TEXT,
    "contact_name" TEXT,
    "amount" DECIMAL(12,2),
    "installments" INTEGER,
    "started_at" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "last_event_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "zapsign_token" TEXT NOT NULL,
    "signer_token" TEXT,
    "signer_email" TEXT NOT NULL,
    "status" "contract_status" NOT NULL DEFAULT 'PENDING',
    "signed_at" TIMESTAMP(3),
    "signed_file_url" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guru_webhook_guru_id_key" ON "guru_webhook"("guru_id");

-- CreateIndex
CREATE INDEX "guru_webhook_email_created_at_idx" ON "guru_webhook"("email", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_email_key" ON "subscription"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_client_id_key" ON "subscription"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_client_id_key" ON "contract"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_zapsign_token_key" ON "contract"("zapsign_token");

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

