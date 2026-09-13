-- CreateEnum
CREATE TYPE "fidelity" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "delta_direction" AS ENUM ('UP', 'DOWN', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "pillar_status" AS ENUM ('DONE', 'IN_PROGRESS', 'NOT_STARTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "data_source_status" AS ENUM ('CONNECTED', 'ERROR', 'NOT_CONNECTED', 'MANUAL');

-- CreateEnum
CREATE TYPE "message_role" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "client" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pillar" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "pillar_status" NOT NULL,
    "data_pending" TEXT,
    "extra" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "pillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "pillar_id" TEXT,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "raw_value" DECIMAL(14,4),
    "unit" TEXT,
    "delta" TEXT,
    "delta_direction" "delta_direction",
    "sub_note" TEXT,
    "fidelity" "fidelity" NOT NULL,
    "fidelity_note" TEXT NOT NULL,
    "is_headline" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "measured_at" TIMESTAMP(3),

    CONSTRAINT "metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "pillar_id" TEXT,
    "text" TEXT NOT NULL,
    "due_label" TEXT NOT NULL,
    "due_date" DATE,
    "owner" TEXT NOT NULL,
    "done_at" TIMESTAMP(3),
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cleared_at" TIMESTAMP(3),

    CONSTRAINT "alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_criterion" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "milestone_criterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_source" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" "data_source_status" NOT NULL,
    "last_synced_at" TIMESTAMP(3),
    "sync_label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "data_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_snapshot" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "label" TEXT NOT NULL,
    "revenue" DECIMAL(14,2) NOT NULL,
    "margin" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "monthly_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_message" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "role" "message_role" NOT NULL,
    "text" TEXT NOT NULL,
    "pillar_ref" TEXT,
    "for_meeting" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_slug_key" ON "client"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "section_client_id_key_key" ON "section"("client_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "pillar_section_id_key_key" ON "pillar"("section_id", "key");

-- CreateIndex
CREATE INDEX "metric_client_id_is_headline_idx" ON "metric"("client_id", "is_headline");

-- CreateIndex
CREATE INDEX "metric_pillar_id_idx" ON "metric"("pillar_id");

-- CreateIndex
CREATE INDEX "recommendation_client_id_done_at_idx" ON "recommendation"("client_id", "done_at");

-- CreateIndex
CREATE INDEX "recommendation_pillar_id_idx" ON "recommendation"("pillar_id");

-- CreateIndex
CREATE INDEX "alert_client_id_cleared_at_idx" ON "alert"("client_id", "cleared_at");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_criterion_client_id_key_key" ON "milestone_criterion"("client_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "data_source_client_id_name_key" ON "data_source"("client_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_snapshot_client_id_month_key" ON "monthly_snapshot"("client_id", "month");

-- CreateIndex
CREATE INDEX "assistant_message_client_id_created_at_idx" ON "assistant_message"("client_id", "created_at");

-- AddForeignKey
ALTER TABLE "section" ADD CONSTRAINT "section_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pillar" ADD CONSTRAINT "pillar_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric" ADD CONSTRAINT "metric_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric" ADD CONSTRAINT "metric_pillar_id_fkey" FOREIGN KEY ("pillar_id") REFERENCES "pillar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_pillar_id_fkey" FOREIGN KEY ("pillar_id") REFERENCES "pillar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_criterion" ADD CONSTRAINT "milestone_criterion_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_source" ADD CONSTRAINT "data_source_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_snapshot" ADD CONSTRAINT "monthly_snapshot_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_message" ADD CONSTRAINT "assistant_message_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
