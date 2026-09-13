-- AlterEnum
ALTER TYPE "import_status" ADD VALUE 'UNDONE';

-- AlterTable
ALTER TABLE "import_job" ADD COLUMN     "undone_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "import_undo" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "previous" JSONB,

    CONSTRAINT "import_undo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_undo_job_id_idx" ON "import_undo"("job_id");

-- AddForeignKey
ALTER TABLE "import_undo" ADD CONSTRAINT "import_undo_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "import_job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

