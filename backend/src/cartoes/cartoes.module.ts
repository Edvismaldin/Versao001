import { Module } from '@nestjs/common';
import { CartoesController } from './cartoes.controller.js';
import { ValidacaoController } from './validacao.controller.js';
import { CartoesService } from './cartoes.service.js';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module.js';
import { AuditoriaModule } from '../auditoria/auditoria.module.js';

@Module({
  imports: [
    AutenticacaoModule,
    AuditoriaModule,
  ],
  controllers: [
    CartoesController,
    ValidacaoController,
  ],
  providers: [CartoesService],
  exports: [CartoesService],
})
export class CartoesModule {}
