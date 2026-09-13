import { Module } from '@nestjs/common';

import { AuditoriaModule } from '../auditoria/auditoria.module.js';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module.js';
import { PresencasController } from './presencas.controller.js';
import { PresencasService } from './presencas.service.js';

@Module({
  imports: [AutenticacaoModule, AuditoriaModule],
  controllers: [PresencasController],
  providers: [PresencasService],
})
export class PresencasModule {}
