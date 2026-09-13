/*
  Warnings:

  - You are about to alter the column `perfil` on the `usuarios` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `usuarios` MODIFY `perfil` ENUM('ADMIN', 'OPERADOR_CARTAO', 'RESPONSAVEL') NOT NULL DEFAULT 'OPERADOR_CARTAO';
