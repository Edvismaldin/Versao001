import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../autenticacao/guards/jwt-auth.guard.js';

@Controller('dashboard')
@UseGuards(
  JwtAuthGuard,
)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('estatisticas')
  buscarEstatisticas(@Req() request: any) {
    return this.dashboardService.buscarEstatisticas(
      request.usuario,
    );
  }
}
