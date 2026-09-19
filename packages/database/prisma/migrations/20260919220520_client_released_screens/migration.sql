-- CreateEnum
CREATE TYPE "store_screen" AS ENUM ('ASSISTANT', 'MONEY', 'MARKETING', 'LOGISTICS', 'MANAGEMENT', 'ORDERS', 'PRODUCTS', 'CUSTOMERS', 'GOALS', 'METRICS', 'INFLUENCERS');

-- AlterTable
ALTER TABLE "client" ADD COLUMN     "released_screens" "store_screen"[] DEFAULT ARRAY['MARKETING', 'ORDERS']::"store_screen"[];
