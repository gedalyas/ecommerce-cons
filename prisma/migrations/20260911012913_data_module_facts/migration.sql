-- CreateEnum
CREATE TYPE "sales_platform" AS ENUM ('ECOMMERCE', 'MARKETPLACE');

-- CreateEnum
CREATE TYPE "financial_status" AS ENUM ('PAID', 'PENDING', 'AUTHORIZED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "processing_method" AS ENUM ('CREDIT_CARD', 'PIX', 'BOLETO');

-- CreateEnum
CREATE TYPE "ad_platform" AS ENUM ('META', 'GOOGLE', 'TIKTOK');

-- CreateEnum
CREATE TYPE "business_unit" AS ENUM ('ECOMMERCE', 'MARKETPLACE', 'BOTH');

-- CreateEnum
CREATE TYPE "cost_category" AS ENUM ('COGS', 'SALES_MARKETING', 'OPERATIONAL');

-- CreateEnum
CREATE TYPE "cost_frequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'ONE_TIME', 'PER_ORDER', 'PERCENT_PER_ORDER', 'PERCENT_OF_AD_SPEND');

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "brand" TEXT,
    "collection" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "cost" DECIMAL(12,2),
    "stock_qty" INTEGER NOT NULL,
    "last_sale_at" TIMESTAMP(3),

    CONSTRAINT "product_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "province" TEXT,
    "acquisition_source" TEXT,
    "first_order_at" TIMESTAMP(3),
    "last_order_at" TIMESTAMP(3),
    "orders_count" INTEGER NOT NULL DEFAULT 0,
    "total_spent" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "days_since_last_purchase" INTEGER,
    "r_score" INTEGER,
    "f_score" INTEGER,
    "m_score" INTEGER,
    "rfm_segment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "placed_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "sales_platform" "sales_platform" NOT NULL,
    "channel" TEXT NOT NULL,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "financial_status" "financial_status" NOT NULL,
    "payment_gateway" TEXT NOT NULL,
    "processing_method" "processing_method" NOT NULL,
    "product_revenue" DECIMAL(12,2) NOT NULL,
    "shipping_revenue" DECIMAL(12,2) NOT NULL,
    "total_discounts" DECIMAL(12,2) NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,
    "discount_codes" TEXT[],
    "country" TEXT NOT NULL DEFAULT 'BR',
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "order_number_for_customer" INTEGER NOT NULL,
    "items_count" INTEGER NOT NULL,

    CONSTRAINT "sales_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "unit_cost" DECIMAL(12,2),

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traffic_daily" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "sessions" INTEGER NOT NULL,
    "users" INTEGER NOT NULL,
    "new_users" INTEGER NOT NULL,
    "view_item" INTEGER NOT NULL,
    "add_to_cart" INTEGER NOT NULL,
    "begin_checkout" INTEGER NOT NULL,

    CONSTRAINT "traffic_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_spend_daily" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "platform" "ad_platform" NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "adset_id" TEXT NOT NULL,
    "adset_name" TEXT NOT NULL,
    "ad_id" TEXT NOT NULL,
    "ad_name" TEXT NOT NULL,
    "spend" DECIMAL(12,2) NOT NULL,
    "platform_fee" DECIMAL(12,2) NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "conversions" INTEGER NOT NULL,
    "attributed_revenue" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ad_spend_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_expense" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "business_unit" "business_unit" NOT NULL,
    "category" "cost_category" NOT NULL,
    "subcategory" TEXT NOT NULL,
    "frequency" "cost_frequency" NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_client_id_category_idx" ON "product"("client_id", "category");

-- CreateIndex
CREATE INDEX "product_variant_sku_idx" ON "product_variant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_product_id_sku_key" ON "product_variant"("product_id", "sku");

-- CreateIndex
CREATE INDEX "customer_client_id_rfm_segment_idx" ON "customer"("client_id", "rfm_segment");

-- CreateIndex
CREATE INDEX "customer_client_id_last_order_at_idx" ON "customer"("client_id", "last_order_at");

-- CreateIndex
CREATE UNIQUE INDEX "customer_client_id_email_key" ON "customer"("client_id", "email");

-- CreateIndex
CREATE INDEX "sales_order_client_id_placed_at_idx" ON "sales_order"("client_id", "placed_at");

-- CreateIndex
CREATE INDEX "sales_order_client_id_financial_status_placed_at_idx" ON "sales_order"("client_id", "financial_status", "placed_at");

-- CreateIndex
CREATE INDEX "sales_order_customer_id_placed_at_idx" ON "sales_order"("customer_id", "placed_at");

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_client_id_number_key" ON "sales_order"("client_id", "number");

-- CreateIndex
CREATE INDEX "order_item_order_id_idx" ON "order_item"("order_id");

-- CreateIndex
CREATE INDEX "order_item_product_id_idx" ON "order_item"("product_id");

-- CreateIndex
CREATE INDEX "order_item_variant_id_idx" ON "order_item"("variant_id");

-- CreateIndex
CREATE INDEX "traffic_daily_client_id_date_idx" ON "traffic_daily"("client_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "traffic_daily_client_id_date_source_medium_key" ON "traffic_daily"("client_id", "date", "source", "medium");

-- CreateIndex
CREATE INDEX "ad_spend_daily_client_id_date_idx" ON "ad_spend_daily"("client_id", "date");

-- CreateIndex
CREATE INDEX "ad_spend_daily_client_id_platform_date_idx" ON "ad_spend_daily"("client_id", "platform", "date");

-- CreateIndex
CREATE INDEX "ad_spend_daily_client_id_campaign_id_date_idx" ON "ad_spend_daily"("client_id", "campaign_id", "date");

-- CreateIndex
CREATE INDEX "cost_expense_client_id_start_date_idx" ON "cost_expense"("client_id", "start_date");

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traffic_daily" ADD CONSTRAINT "traffic_daily_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_spend_daily" ADD CONSTRAINT "ad_spend_daily_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_expense" ADD CONSTRAINT "cost_expense_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
