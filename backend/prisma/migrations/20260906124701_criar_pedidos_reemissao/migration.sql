-- CreateTable
CREATE TABLE `pedidos_reemissao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `motivo` VARCHAR(191) NOT NULL,
    `documento` VARCHAR(191) NULL,
    `estado` ENUM('PENDENTE', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'CONCLUIDO') NOT NULL DEFAULT 'PENDENTE',
    `observacao` VARCHAR(191) NULL,
    `estudanteId` INTEGER NOT NULL,
    `cartaoId` INTEGER NOT NULL,
    `responsavelId` INTEGER NULL,
    `analisadoEm` DATETIME(3) NULL,
    `concluidoEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pedidos_reemissao` ADD CONSTRAINT `pedidos_reemissao_estudanteId_fkey` FOREIGN KEY (`estudanteId`) REFERENCES `estudantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_reemissao` ADD CONSTRAINT `pedidos_reemissao_cartaoId_fkey` FOREIGN KEY (`cartaoId`) REFERENCES `cartoes_academicos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_reemissao` ADD CONSTRAINT `pedidos_reemissao_responsavelId_fkey` FOREIGN KEY (`responsavelId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
