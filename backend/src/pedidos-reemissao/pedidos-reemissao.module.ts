import { Module } from '@nestjs/common';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module.js';
import { CartoesModule } from '../cartoes/cartoes.module.js';
import { AuditoriaModule } from '../auditoria/auditoria.module.js';
import { PedidosReemissaoController } from './pedidos-reemissao.controller.js';
import { PedidosReemissaoService } from './pedidos-reemissao.service.js';

@Module({
  imports: [
    AutenticacaoModule,
    CartoesModule,
    AuditoriaModule,
  ],
  controllers: [PedidosReemissaoController],
  providers: [PedidosReemissaoService],
})
export class PedidosReemissaoModule {}
