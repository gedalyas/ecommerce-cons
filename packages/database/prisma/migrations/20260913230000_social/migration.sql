-- CreateEnum
CREATE TYPE "social_platform" AS ENUM ('INSTAGRAM', 'FACEBOOK');

-- CreateTable
CREATE TABLE "social_daily" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "platform" "social_platform" NOT NULL,
    "account_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "followers" INTEGER NOT NULL,
    "reach" INTEGER NOT NULL,
    "engagement" INTEGER NOT NULL,
    "posts" INTEGER NOT NULL,

    CONSTRAINT "social_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_post" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "platform" "social_platform" NOT NULL,
    "account_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "permalink" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "likes" INTEGER NOT NULL,
    "comments" INTEGER NOT NULL,
    "saves" INTEGER NOT NULL,
    "shares" INTEGER NOT NULL,
    "reach" INTEGER NOT NULL,

    CONSTRAINT "social_post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_daily_client_id_date_idx" ON "social_daily"("client_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "social_daily_client_id_platform_account_id_date_key" ON "social_daily"("client_id", "platform", "account_id", "date");

-- CreateIndex
CREATE INDEX "social_post_client_id_published_at_idx" ON "social_post"("client_id", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "social_post_client_id_platform_external_id_key" ON "social_post"("client_id", "platform", "external_id");

-- AddForeignKey
ALTER TABLE "social_daily" ADD CONSTRAINT "social_daily_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post" ADD CONSTRAINT "social_post_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

