import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { AuditoriaService } from './auditoria.service.js';
import { JwtAuthGuard } from '../autenticacao/guards/jwt-auth.guard.js';
import { PerfisGuard } from '../autenticacao/guards/perfis.guard.js';
import { Perfis } from '../autenticacao/decorators/perfis.decorator.js';

@Controller('auditoria')
@UseGuards(
  JwtAuthGuard,
  PerfisGuard,
)
@Perfis('ADMIN')
export class AuditoriaController {
  constructor(
    private readonly auditoriaService: AuditoriaService,
  ) {}

  @Get()
  listar() {
    return this.auditoriaService.listar();
  }
}