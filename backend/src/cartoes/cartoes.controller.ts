import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { CartoesService } from './cartoes.service.js';
import { CriarCartaoDto } from './dto/criar-cartao.dto.js';
import { JwtAuthGuard } from '../autenticacao/guards/jwt-auth.guard.js';
import { PerfisGuard } from '../autenticacao/guards/perfis.guard.js';
import { Perfis } from '../autenticacao/decorators/perfis.decorator.js';

@UseGuards(JwtAuthGuard, PerfisGuard)
@Controller('cartoes')
export class CartoesController {
  constructor(private readonly cartoesService: CartoesService) {}

  @Perfis('ADMIN', 'OPERADOR_CARTAO')
  @Post()
  criar(@Body() dados: CriarCartaoDto, @Req() request: any) {
    return this.cartoesService.criar(dados, request.usuario.sub);
  }

  @Get()
  listar() {
    return this.cartoesService.listar();
  }

  @Get('meu-cartao')
  @UseGuards(JwtAuthGuard, PerfisGuard)
  @Perfis('ESTUDANTE')
  meuCartao(
    @Req()
    request: any,
  ) {
    return this.cartoesService.meuCartao(
      request.usuario.sub,
    );
  }

  @Get('validar/:token')
  validar(@Param('token') token: string) {
    return this.cartoesService.validarCartao(token);
  }

  @Get(':id/qrcode')
  gerarQrCode(@Param('id', ParseIntPipe) id: number) {
    return this.cartoesService.gerarQrCode(id);
  }

  @Get(':id/pdf')
  @Perfis('ADMIN', 'OPERADOR_CARTAO', 'RESPONSAVEL', 'ESTUDANTE')
  async gerarPdf(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: any,
    @Res() response: Response,
  ) {
    const arquivo = await this.cartoesService.gerarPdf(
      id,
      request.usuario,
    );

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Length',
      arquivo.buffer.length.toString(),
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${arquivo.nomeArquivo}"`,
    );

    return response.send(arquivo.buffer);
  }

  @Get('pdf/lote')
  @Perfis('ADMIN', 'OPERADOR_CARTAO', 'RESPONSAVEL')
  async gerarPdfLote(
    @Query('ids') ids: string | undefined,
    @Req() request: any,
    @Res() response: Response,
  ) {
    const arquivo = await this.cartoesService.gerarPdfLote(
      ids,
      request.usuario,
    );

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Length',
      arquivo.buffer.length.toString(),
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${arquivo.nomeArquivo}"`,
    );

    return response.send(arquivo.buffer);
  }

  @Get('estudante/:estudanteId/historico')
  historicoPorEstudante(
    @Param('estudanteId', ParseIntPipe) estudanteId: number,
  ) {
    return this.cartoesService.historicoPorEstudante(
      estudanteId,
    );
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.cartoesService.buscarPorId(id);
  }

  @Perfis('ADMIN')
  @Patch(':id/bloquear')
  bloquear(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { motivo: string },
    @Req() request: any,
  ) {
    return this.cartoesService.bloquear(
      id,
      body.motivo,
      request.usuario.sub,
    );
  }

  @Perfis('ADMIN', 'RESPONSAVEL')
  @Patch(':id/reemitir')
  reemitir(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { motivo: string },
    @Req() request: any,
  ) {
    return this.cartoesService.reemitir(
      id,
      body.motivo,
      request.usuario.sub,
    );
  }
}
