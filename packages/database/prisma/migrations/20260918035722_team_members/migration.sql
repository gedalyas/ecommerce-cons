-- CreateEnum
CREATE TYPE "client_membership" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "access_area" AS ENUM ('MONEY', 'MARKETING', 'LOGISTICS', 'MANAGEMENT', 'DATA');

-- AlterTable
ALTER TABLE "client" ADD COLUMN     "team_seat_limit" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "invitation" ADD COLUMN     "edit_areas" "access_area"[] DEFAULT ARRAY[]::"access_area"[],
ADD COLUMN     "membership" "client_membership" NOT NULL DEFAULT 'OWNER',
ADD COLUMN     "view_areas" "access_area"[] DEFAULT ARRAY[]::"access_area"[];

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "edit_areas" "access_area"[] DEFAULT ARRAY[]::"access_area"[],
ADD COLUMN     "membership" "client_membership" NOT NULL DEFAULT 'OWNER',
ADD COLUMN     "view_areas" "access_area"[] DEFAULT ARRAY[]::"access_area"[];
