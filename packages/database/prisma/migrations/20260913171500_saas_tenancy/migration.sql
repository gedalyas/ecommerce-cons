-- CreateEnum
CREATE TYPE "connection_request_status" AS ENUM ('REQUESTED', 'IN_PROGRESS', 'DONE', 'DECLINED');

-- AlterEnum
ALTER TYPE "user_role" ADD VALUE 'ADMIN';

-- DropForeignKey
ALTER TABLE "alert" DROP CONSTRAINT "alert_client_id_fkey";

-- DropForeignKey
ALTER TABLE "assistant_message" DROP CONSTRAINT "assistant_message_client_id_fkey";

-- DropForeignKey
ALTER TABLE "metric" DROP CONSTRAINT "metric_client_id_fkey";

-- DropForeignKey
ALTER TABLE "metric" DROP CONSTRAINT "metric_pillar_id_fkey";

-- DropForeignKey
ALTER TABLE "monthly_snapshot" DROP CONSTRAINT "monthly_snapshot_client_id_fkey";

-- DropForeignKey
ALTER TABLE "pillar" DROP CONSTRAINT "pillar_section_id_fkey";

-- DropForeignKey
ALTER TABLE "section" DROP CONSTRAINT "section_client_id_fkey";

-- DropIndex
DROP INDEX "data_source_client_id_name_key";

-- DropIndex
DROP INDEX "pillar_section_id_key_key";

-- AlterTable
ALTER TABLE "client" ADD COLUMN     "monthly_revenue_band" TEXT,
ADD COLUMN     "onboarded_at" TIMESTAMP(3),
ADD COLUMN     "platform" TEXT,
ADD COLUMN     "segment" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';

-- AlterTable
ALTER TABLE "data_source" ADD COLUMN     "connector_key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "milestone_criterion" DROP COLUMN "name",
ALTER COLUMN "progress" SET DEFAULT 0,
ALTER COLUMN "note" SET DEFAULT '';

-- AlterTable
ALTER TABLE "pillar" DROP COLUMN "extra",
DROP COLUMN "section_id",
DROP COLUMN "title",
ADD COLUMN     "area_key" TEXT NOT NULL,
ADD COLUMN     "client_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "recommendation" DROP COLUMN "due_label",
ALTER COLUMN "due_date" SET NOT NULL;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "client_id" DROP NOT NULL;

-- DropTable
DROP TABLE "alert";

-- DropTable
DROP TABLE "assistant_message";

-- DropTable
DROP TABLE "metric";

-- DropTable
DROP TABLE "monthly_snapshot";

-- DropTable
DROP TABLE "section";

-- DropEnum
DROP TYPE "delta_direction";

-- DropEnum
DROP TYPE "message_role";

-- CreateTable
CREATE TABLE "consultant_assignment" (
    "id" TEXT NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultant_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "client_id" TEXT,
    "invited_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_kpi_value" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "pillar_key" TEXT NOT NULL,
    "kpi_key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "delta" TEXT,
    "fidelity" "fidelity" NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_kpi_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_request" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "connector_key" TEXT NOT NULL,
    "status" "connection_request_status" NOT NULL DEFAULT 'REQUESTED',
    "note" TEXT NOT NULL DEFAULT '',
    "requested_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "connection_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consultant_assignment_consultant_id_client_id_key" ON "consultant_assignment"("consultant_id", "client_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitation_email_key" ON "invitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "manual_kpi_value_client_id_pillar_key_kpi_key_key" ON "manual_kpi_value"("client_id", "pillar_key", "kpi_key");

-- CreateIndex
CREATE INDEX "connection_request_client_id_status_idx" ON "connection_request"("client_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "data_source_client_id_connector_key_key" ON "data_source"("client_id", "connector_key");

-- CreateIndex
CREATE INDEX "pillar_client_id_area_key_idx" ON "pillar"("client_id", "area_key");

-- CreateIndex
CREATE UNIQUE INDEX "pillar_client_id_key_key" ON "pillar"("client_id", "key");

-- AddForeignKey
ALTER TABLE "consultant_assignment" ADD CONSTRAINT "consultant_assignment_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_assignment" ADD CONSTRAINT "consultant_assignment_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pillar" ADD CONSTRAINT "pillar_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_kpi_value" ADD CONSTRAINT "manual_kpi_value_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_request" ADD CONSTRAINT "connection_request_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_request" ADD CONSTRAINT "connection_request_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

