-- DropIndex
DROP INDEX "connection_client_id_connector_key_key";

-- AlterTable
ALTER TABLE "connection" DROP COLUMN "auth_pattern",
DROP COLUMN "credentials",
DROP COLUMN "external_id",
DROP COLUMN "external_label",
ADD COLUMN     "account_id" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sales_order" ADD COLUMN     "connection_id" TEXT;

-- CreateTable
CREATE TABLE "connector_account" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "auth_pattern" "connection_auth_pattern" NOT NULL,
    "external_id" TEXT NOT NULL,
    "external_label" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "authorized_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connector_account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connector_account_client_id_family_external_id_key" ON "connector_account"("client_id", "family", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "connector_account_id_client_id_key" ON "connector_account"("id", "client_id");

-- CreateIndex
CREATE INDEX "connection_client_id_connector_key_idx" ON "connection"("client_id", "connector_key");

-- CreateIndex
CREATE UNIQUE INDEX "connection_account_id_connector_key_key" ON "connection"("account_id", "connector_key");

-- CreateIndex
CREATE INDEX "sales_order_connection_id_idx" ON "sales_order"("connection_id");

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_account" ADD CONSTRAINT "connector_account_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection" ADD CONSTRAINT "connection_account_id_client_id_fkey" FOREIGN KEY ("account_id", "client_id") REFERENCES "connector_account"("id", "client_id") ON DELETE CASCADE ON UPDATE CASCADE;

