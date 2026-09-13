-- CreateEnum
CREATE TYPE "connection_auth_pattern" AS ENUM ('OAUTH', 'DOMAIN_OAUTH', 'CREDENTIALS');

-- CreateEnum
CREATE TYPE "connection_stage" AS ENUM ('AUTHORIZED', 'IMPORTING', 'PROCESSING', 'READY', 'ERROR');

-- CreateTable
CREATE TABLE "connection" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "connector_key" TEXT NOT NULL,
    "auth_pattern" "connection_auth_pattern" NOT NULL,
    "external_id" TEXT NOT NULL,
    "external_label" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "stage" "connection_stage" NOT NULL DEFAULT 'AUTHORIZED',
    "sync_cursor" JSONB,
    "last_sync_at" TIMESTAMP(3),
    "last_error" TEXT,
    "authorized_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_record" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connection_client_id_connector_key_key" ON "connection"("client_id", "connector_key");

-- CreateIndex
CREATE INDEX "raw_record_connection_id_kind_fetched_at_idx" ON "raw_record"("connection_id", "kind", "fetched_at");

-- CreateIndex
CREATE UNIQUE INDEX "raw_record_connection_id_kind_external_id_key" ON "raw_record"("connection_id", "kind", "external_id");

-- AddForeignKey
ALTER TABLE "connection" ADD CONSTRAINT "connection_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_record" ADD CONSTRAINT "raw_record_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

