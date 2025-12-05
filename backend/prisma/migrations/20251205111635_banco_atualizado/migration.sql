/*
  Warnings:

  - You are about to drop the `ListaEspera` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notificacao` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ListaEspera" DROP CONSTRAINT "ListaEspera_pacienteId_fkey";

-- DropForeignKey
ALTER TABLE "ListaEspera" DROP CONSTRAINT "ListaEspera_profissionalId_fkey";

-- DropForeignKey
ALTER TABLE "Notificacao" DROP CONSTRAINT "Notificacao_agendamentoId_fkey";

-- DropForeignKey
ALTER TABLE "Notificacao" DROP CONSTRAINT "Notificacao_destinatarioId_fkey";

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "fotoPerfil" TEXT;

-- DropTable
DROP TABLE "ListaEspera";

-- DropTable
DROP TABLE "Notificacao";

-- DropEnum
DROP TYPE "CanalNotificacao";

-- DropEnum
DROP TYPE "StatusListaEspera";

-- DropEnum
DROP TYPE "StatusNotificacao";

-- DropEnum
DROP TYPE "TipoNotificacao";
