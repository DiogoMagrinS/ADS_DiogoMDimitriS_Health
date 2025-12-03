-- CreateEnum
CREATE TYPE "StatusListaEspera" AS ENUM ('ATIVO', 'CONVERTIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "ListaEspera" (
    "id" SERIAL NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "profissionalId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusListaEspera" NOT NULL DEFAULT 'ATIVO',

    CONSTRAINT "ListaEspera_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListaEspera_profissionalId_data_status_idx" ON "ListaEspera"("profissionalId", "data", "status");

-- CreateIndex
CREATE INDEX "ListaEspera_pacienteId_status_idx" ON "ListaEspera"("pacienteId", "status");

-- AddForeignKey
ALTER TABLE "ListaEspera" ADD CONSTRAINT "ListaEspera_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaEspera" ADD CONSTRAINT "ListaEspera_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
