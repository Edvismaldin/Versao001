import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { FaculdadesModule } from './faculdades/faculdades.module.js';
import { CursosModule } from './cursos/cursos.module.js';
import { EstudantesModule } from './estudantes/estudantes.module.js';
import { CartoesModule } from './cartoes/cartoes.module.js';
import { AutenticacaoModule } from './autenticacao/autenticacao.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { PedidosReemissaoModule } from './pedidos-reemissao/pedidos-reemissao.module.js';
import { EmailModule } from './email/email.module.js';
import { AuditoriaModule } from './auditoria/auditoria.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { PresencasModule } from './presencas/presencas.module.js';


export const { ObserveModule, ObserveInstrument } = createObserveModule();
const observeAppKey = process.env.NEST_OBSERVE_APP_KEY;
const observeAppSecret = process.env.NEST_OBSERVE_APP_SECRET;
export const observabilidadeAtiva = Boolean(observeAppKey && observeAppSecret);

const modulosObserve = observabilidadeAtiva
  ? [
      ObserveModule.forRoot({
        serviceId: 'ucm-card-backend',
        appKey: observeAppKey!,
        appSecret: observeAppSecret!,
      }),
    ]
  : [];

@Module({
  imports: [
    ...modulosObserve,
    PrismaModule,
    FaculdadesModule,
    CursosModule,
    EstudantesModule,
    CartoesModule,
    AutenticacaoModule,
    UsuariosModule,
    PedidosReemissaoModule,
    EmailModule,
    AuditoriaModule,
    DashboardModule,
    PresencasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
