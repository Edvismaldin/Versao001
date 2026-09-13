-- CreateTable
CREATE TABLE `cartoes_academicos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroCartao` VARCHAR(191) NOT NULL,
    `qrToken` VARCHAR(191) NOT NULL,
    `dataEmissao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataValidade` DATETIME(3) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'ATIVO',
    `estudanteId` INTEGER NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cartoes_academicos_numeroCartao_key`(`numeroCartao`),
    UNIQUE INDEX `cartoes_academicos_qrToken_key`(`qrToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cartoes_academicos` ADD CONSTRAINT `cartoes_academicos_estudanteId_fkey` FOREIGN KEY (`estudanteId`) REFERENCES `estudantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
