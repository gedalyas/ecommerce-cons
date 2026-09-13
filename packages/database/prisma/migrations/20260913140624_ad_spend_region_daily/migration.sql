-- CreateTable
CREATE TABLE "ad_spend_region_daily" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "platform" "ad_platform" NOT NULL,
    "province" TEXT NOT NULL,
    "spend" DECIMAL(12,2) NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "conversions" INTEGER NOT NULL,
    "attributed_revenue" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ad_spend_region_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ad_spend_region_daily_client_id_date_idx" ON "ad_spend_region_daily"("client_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ad_spend_region_daily_client_id_date_platform_province_key" ON "ad_spend_region_daily"("client_id", "date", "platform", "province");

-- AddForeignKey
ALTER TABLE "ad_spend_region_daily" ADD CONSTRAINT "ad_spend_region_daily_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
