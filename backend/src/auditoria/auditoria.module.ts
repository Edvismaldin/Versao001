import { Module } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service.js';
import { AuditoriaController } from './auditoria.controller.js';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module.js';

@Module({
  imports: [
    AutenticacaoModule,
  ],

  controllers: [
    AuditoriaController,
  ],
  providers: [
    AuditoriaService,
  ],
  exports: [
    AuditoriaService,
  ],
})
export class AuditoriaModule {}
