ALTER TABLE `usuarios`
MODIFY COLUMN `perfil`
ENUM(
  'ADMIN',
  'OPERADOR_CARTAO',
  'RESPONSAVEL',
  'ESTUDANTE'
)
NOT NULL
DEFAULT 'OPERADOR_CARTAO';


ALTER TABLE `pedidos_reemissao`
MODIFY COLUMN `estado`
ENUM(
  'PENDENTE',
  'EM_ANALISE',
  'APROVADO',
  'EM_PRODUCAO',
  'PRONTO_LEVANTAMENTO',
  'ENTREGUE',
  'REJEITADO',
  'CONCLUIDO'
)
NOT NULL
DEFAULT 'PENDENTE';

ALTER TABLE `pedidos_reemissao`
ADD COLUMN `entregueEm` DATETIME(3) NULL,
ADD COLUMN `localLevantamento` VARCHAR(191) NULL,
ADD COLUMN `prontoEm` DATETIME(3) NULL;


CREATE TABLE `ativacoes_estudante` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `tokenHash` VARCHAR(191) NOT NULL,

  `estado` ENUM(
    'PENDENTE',
    'UTILIZADO',
    'EXPIRADO'
  ) NOT NULL DEFAULT 'PENDENTE',

  `estudanteId` INTEGER NOT NULL,
  `expiraEm` DATETIME(3) NOT NULL,
  `utilizadoEm` DATETIME(3) NULL,
  `criadoEm` DATETIME(3)
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  INDEX `ativacoes_estudante_expiraEm_idx`
    (`expiraEm`),

  CONSTRAINT `ativacoes_estudante_estudanteId_fkey`
    FOREIGN KEY (`estudanteId`)
    REFERENCES `estudantes` (`id`)
    ON UPDATE CASCADE
);
