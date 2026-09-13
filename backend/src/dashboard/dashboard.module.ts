import { Module } from '@nestjs/common';

import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module.js';

@Module({
  imports: [
    AutenticacaoModule,
  ],

  controllers: [
    DashboardController,
  ],

  providers: [
    DashboardService,
  ],
})
export class DashboardModule {}
