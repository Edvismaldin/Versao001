/*
  Warnings:

  - A unique constraint covering the columns `[cartaoAnteriorId]` on the table `cartoes_academicos` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `cartoes_academicos` ADD COLUMN `bloqueadoEm` DATETIME(3) NULL,
    ADD COLUMN `cartaoAnteriorId` INTEGER NULL,
    ADD COLUMN `motivoBloqueio` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `cartoes_academicos_cartaoAnteriorId_key` ON `cartoes_academicos`(`cartaoAnteriorId`);

-- AddForeignKey
ALTER TABLE `cartoes_academicos` ADD CONSTRAINT `cartoes_academicos_cartaoAnteriorId_fkey` FOREIGN KEY (`cartaoAnteriorId`) REFERENCES `cartoes_academicos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
