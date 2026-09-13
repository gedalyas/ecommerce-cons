/*
  Warnings:

  - You are about to drop the column `sync_label` on the `data_source` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "data_source" DROP COLUMN "sync_label";
