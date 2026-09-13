-- AlterTable
ALTER TABLE "invitation" ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "token_hash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "invitation_token_hash_key" ON "invitation"("token_hash");

