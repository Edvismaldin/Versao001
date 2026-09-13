-- AlterTable
ALTER TABLE `ativacoes_estudante`
ADD COLUMN `tentativas` INTEGER NOT NULL DEFAULT 0;

-- RedefineIndex
CREATE INDEX `ativacoes_estudante_estudanteId_idx`
ON `ativacoes_estudante`(`estudanteId`);
