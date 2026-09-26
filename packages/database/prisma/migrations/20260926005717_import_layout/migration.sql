-- CreateTable
CREATE TABLE "import_layout" (
    "client_id" TEXT NOT NULL,
    "kind" "import_kind" NOT NULL,
    "layout_key" TEXT NOT NULL,
    "mapping" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_layout_pkey" PRIMARY KEY ("client_id","kind","layout_key")
);

-- AddForeignKey
ALTER TABLE "import_layout" ADD CONSTRAINT "import_layout_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
