/*
  Warnings:

  - The values [AGENDADA] on the enum `StatusNotificacao` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatusNotificacao_new" AS ENUM ('CRIADA', 'ENVIADA', 'FALHOU');
ALTER TABLE "Notificacao" ALTER COLUMN "status" TYPE "StatusNotificacao_new" USING ("status"::text::"StatusNotificacao_new");
ALTER TYPE "StatusNotificacao" RENAME TO "StatusNotificacao_old";
ALTER TYPE "StatusNotificacao_new" RENAME TO "StatusNotificacao";
DROP TYPE "public"."StatusNotificacao_old";
COMMIT;

-- DropIndex
DROP INDEX "Notificacao_status_idx";

-- AlterTable
ALTER TABLE "Agendamento" ADD COLUMN     "googleEventId" TEXT;

-- AlterTable
ALTER TABLE "Profissional" ADD COLUMN     "googleAccessToken" TEXT,
ADD COLUMN     "googleCalendarId" TEXT,
ADD COLUMN     "googleRefreshToken" TEXT,
ADD COLUMN     "googleTokenExpiry" TIMESTAMP(3);
