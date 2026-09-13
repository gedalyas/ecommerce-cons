-- CreateTable
CREATE TABLE "audit_event" (
    "id" TEXT NOT NULL,
    "client_id" TEXT,
    "actor_id" TEXT,
    "actor_name" TEXT NOT NULL,
    "actor_role" "user_role" NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_event_client_id_created_at_idx" ON "audit_event"("client_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_event_actor_id_idx" ON "audit_event"("actor_id");

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

