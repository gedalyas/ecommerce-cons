-- CreateTable
CREATE TABLE "goal" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "total_sold" DECIMAL(12,2) NOT NULL,
    "average_ticket" DECIMAL(12,2) NOT NULL,
    "conversion_rate" DECIMAL(6,3) NOT NULL,
    "paid_traffic" DECIMAL(12,2) NOT NULL,
    "other_marketing" DECIMAL(12,2) NOT NULL,
    "repurchase_rate" DECIMAL(6,3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "goal_client_id_year_month_key" ON "goal"("client_id", "year", "month");

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "goal_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
