-- AlterTable
ALTER TABLE `usuarios`
MODIFY COLUMN `perfil`
ENUM('ADMIN', 'PROFESSOR', 'OPERADOR_CARTAO', 'RESPONSAVEL', 'ESTUDANTE')
NOT NULL DEFAULT 'OPERADOR_CARTAO';

-- CreateTable
CREATE TABLE `sessoes_presenca` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `disciplina` VARCHAR(191) NOT NULL,
  `turma` VARCHAR(191) NULL,
  `abertaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fechadaEm` DATETIME(3) NULL,
  `professorId` INTEGER NOT NULL,
  `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizadoEm` DATETIME(3) NOT NULL,
  INDEX `sessoes_presenca_professorId_idx`(`professorId`),
  INDEX `sessoes_presenca_fechadaEm_idx`(`fechadaEm`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `presencas_aula` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `sessaoId` INTEGER NOT NULL,
  `estudanteId` INTEGER NOT NULL,
  `cartaoId` INTEGER NOT NULL,
  `registadaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `presencas_aula_sessaoId_estudanteId_key`(`sessaoId`, `estudanteId`),
  INDEX `presencas_aula_estudanteId_idx`(`estudanteId`),
  INDEX `presencas_aula_cartaoId_idx`(`cartaoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessoes_presenca` ADD CONSTRAINT `sessoes_presenca_professorId_fkey`
FOREIGN KEY (`professorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `presencas_aula` ADD CONSTRAINT `presencas_aula_sessaoId_fkey`
FOREIGN KEY (`sessaoId`) REFERENCES `sessoes_presenca`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `presencas_aula` ADD CONSTRAINT `presencas_aula_estudanteId_fkey`
FOREIGN KEY (`estudanteId`) REFERENCES `estudantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `presencas_aula` ADD CONSTRAINT `presencas_aula_cartaoId_fkey`
FOREIGN KEY (`cartaoId`) REFERENCES `cartoes_academicos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
