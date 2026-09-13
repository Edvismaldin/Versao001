/*
  Warnings:

  - A unique constraint covering the columns `[estudanteId]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `estudanteId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `usuarios_estudanteId_key` ON `usuarios`(`estudanteId`);

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_estudanteId_fkey` FOREIGN KEY (`estudanteId`) REFERENCES `estudantes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
