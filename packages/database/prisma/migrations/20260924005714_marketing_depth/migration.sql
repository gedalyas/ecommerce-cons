-- CreateEnum
CREATE TYPE "audience_dimension" AS ENUM ('GENDER', 'AGE');

-- CreateEnum
CREATE TYPE "funnel_stage" AS ENUM ('TOP', 'MIDDLE', 'BOTTOM');

-- AlterTable
ALTER TABLE "ad_spend_daily" ADD COLUMN     "account_id" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "account_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "add_to_cart" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "campaign_type" TEXT,
ADD COLUMN     "eligible_impressions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "landing_page_views" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "leads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "link_clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "messages" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reach" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "thumbnail_url" TEXT;

-- AlterTable
ALTER TABLE "traffic_daily" ADD COLUMN     "duration_seconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "engaged_sessions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "page_views" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "purchases" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ad_keyword_daily" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "platform" "ad_platform" NOT NULL,
    "account_id" TEXT NOT NULL DEFAULT '',
    "campaign_id" TEXT NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "ad_group_id" TEXT NOT NULL,
    "ad_group_name" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "match_type" TEXT NOT NULL DEFAULT '',
    "spend" DECIMAL(12,2) NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "conversions" INTEGER NOT NULL,

    CONSTRAINT "ad_keyword_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traffic_page_daily" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "page_path" TEXT NOT NULL,
    "page_views" INTEGER NOT NULL,
    "sessions" INTEGER NOT NULL,
    "engaged_sessions" INTEGER NOT NULL,
    "duration_seconds" INTEGER NOT NULL,

    CONSTRAINT "traffic_page_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traffic_item_daily" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "item_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "items_viewed" INTEGER NOT NULL,
    "items_added_to_cart" INTEGER NOT NULL,
    "items_purchased" INTEGER NOT NULL,

    CONSTRAINT "traffic_item_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traffic_audience_daily" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "dimension" "audience_dimension" NOT NULL,
    "value" TEXT NOT NULL,
    "sessions" INTEGER NOT NULL,
    "engaged_sessions" INTEGER NOT NULL,
    "users" INTEGER NOT NULL,
    "purchases" INTEGER NOT NULL,

    CONSTRAINT "traffic_audience_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traffic_region_daily" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "province" TEXT NOT NULL,
    "sessions" INTEGER NOT NULL,
    "page_views" INTEGER NOT NULL,
    "engaged_sessions" INTEGER NOT NULL,
    "purchases" INTEGER NOT NULL,

    CONSTRAINT "traffic_region_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_tag" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "platform" "ad_platform" NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "stage" "funnel_stage",
    "channel" TEXT NOT NULL DEFAULT 'site',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ad_keyword_daily_client_id_date_platform_account_id_ad_grou_key" ON "ad_keyword_daily"("client_id", "date", "platform", "account_id", "ad_group_id", "keyword", "match_type");

-- CreateIndex
CREATE UNIQUE INDEX "traffic_page_daily_client_id_date_page_path_key" ON "traffic_page_daily"("client_id", "date", "page_path");

-- CreateIndex
CREATE UNIQUE INDEX "traffic_item_daily_client_id_date_item_id_key" ON "traffic_item_daily"("client_id", "date", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "traffic_audience_daily_client_id_date_dimension_value_key" ON "traffic_audience_daily"("client_id", "date", "dimension", "value");

-- CreateIndex
CREATE UNIQUE INDEX "traffic_region_daily_client_id_date_province_key" ON "traffic_region_daily"("client_id", "date", "province");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_tag_client_id_platform_campaign_id_key" ON "campaign_tag"("client_id", "platform", "campaign_id");

-- AddForeignKey
ALTER TABLE "ad_keyword_daily" ADD CONSTRAINT "ad_keyword_daily_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traffic_page_daily" ADD CONSTRAINT "traffic_page_daily_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traffic_item_daily" ADD CONSTRAINT "traffic_item_daily_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traffic_audience_daily" ADD CONSTRAINT "traffic_audience_daily_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traffic_region_daily" ADD CONSTRAINT "traffic_region_daily_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_tag" ADD CONSTRAINT "campaign_tag_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
