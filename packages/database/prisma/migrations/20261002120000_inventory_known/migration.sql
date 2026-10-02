-- AlterEnum
ALTER TYPE "import_kind" ADD VALUE 'PRODUCTS';

-- AlterTable
ALTER TABLE "product_variant" DROP COLUMN "last_sale_at",
ADD COLUMN     "stock_updated_at" TIMESTAMP(3),
ALTER COLUMN "stock_qty" DROP NOT NULL;

