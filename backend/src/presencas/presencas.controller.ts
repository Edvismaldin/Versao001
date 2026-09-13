import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../autenticacao/guards/jwt-auth.guard.js';
import { PerfisGuard } from '../autenticacao/guards/perfis.guard.js';
import { Perfis } from '../autenticacao/decorators/perfis.decorator.js';
import { AbrirSessaoDto } from './dto/abrir-sessao.dto.js';
import { RegistarPresencaDto } from './dto/registar-presenca.dto.js';
import { PresencasService } from './presencas.service.js';

@Controller('presencas')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis('ADMIN', 'PROFESSOR')
export class PresencasController {
  constructor(private readonly presencasService: PresencasService) {}

  @Post('sessoes')
  abrirSessao(@Body() dados: AbrirSessaoDto, @Req() request: any) {
    return this.presencasService.abrirSessao(dados, request.usuario);
  }

  @Get('sessoes')
  listarSessoes(@Req() request: any) {
    return this.presencasService.listarMinhasSessoes(request.usuario);
  }

  @Get('sessoes/:id')
  listarPresencas(@Param('id', ParseIntPipe) id: number, @Req() request: any) {
    return this.presencasService.listarPresencas(id, request.usuario);
  }

  @Post('sessoes/:id/registos')
  registar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: RegistarPresencaDto,
    @Req() request: any,
  ) {
    return this.presencasService.registarPresenca(id, dados.qrCode, request.usuario);
  }

  @Patch('sessoes/:id/fechar')
  fecharSessao(@Param('id', ParseIntPipe) id: number, @Req() request: any) {
    return this.presencasService.fecharSessao(id, request.usuario);
  }
}
