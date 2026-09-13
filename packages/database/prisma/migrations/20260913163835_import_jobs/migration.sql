-- CreateEnum
CREATE TYPE "import_kind" AS ENUM ('ORDERS', 'AD_SPEND', 'TRAFFIC');

-- CreateEnum
CREATE TYPE "import_status" AS ENUM ('DONE', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "import_job" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "user_id" TEXT,
    "kind" "import_kind" NOT NULL,
    "status" "import_status" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "rows_total" INTEGER NOT NULL,
    "rows_imported" INTEGER NOT NULL,
    "rows_rejected" INTEGER NOT NULL,
    "errors" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "import_job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_job_client_id_created_at_idx" ON "import_job"("client_id", "created_at");

-- AddForeignKey
ALTER TABLE "import_job" ADD CONSTRAINT "import_job_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job" ADD CONSTRAINT "import_job_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
