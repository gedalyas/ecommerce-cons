-- AlterTable
ALTER TABLE "sales_order" ADD COLUMN     "source" TEXT;

-- CreateTable
CREATE TABLE "store_data_source" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_data_source_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_data_source_client_id_kind_key" ON "store_data_source"("client_id", "kind");

-- AddForeignKey
ALTER TABLE "store_data_source" ADD CONSTRAINT "store_data_source_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
