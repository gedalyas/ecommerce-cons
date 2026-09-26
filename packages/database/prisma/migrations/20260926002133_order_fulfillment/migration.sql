-- CreateEnum
CREATE TYPE "fulfillment" AS ENUM ('SELLER', 'MARKETPLACE');

-- AlterTable
ALTER TABLE "sales_order" ADD COLUMN     "fulfillment" "fulfillment";
