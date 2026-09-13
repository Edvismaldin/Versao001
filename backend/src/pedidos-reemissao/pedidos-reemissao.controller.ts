import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';

import { PedidosReemissaoService } from './pedidos-reemissao.service.js';
import { CriarPedidoReemissaoDto } from './dto/criar-pedido-reemissao.dto.js';
import { RejeitarPedidoDto } from './dto/rejeitar-pedido.dto.js';
import { MarcarProntoDto } from './dto/marcar-pronto.dto.js';
import { JwtAuthGuard } from '../autenticacao/guards/jwt-auth.guard.js';
import { PerfisGuard } from '../autenticacao/guards/perfis.guard.js';
import { Perfis } from '../autenticacao/decorators/perfis.decorator.js';

@Controller('pedidos-reemissao')
export class PedidosReemissaoController {
  constructor(
    private readonly pedidosReemissaoService: PedidosReemissaoService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PerfisGuard)
  @Perfis('ESTUDANTE')
  criar(
    @Req()
    request: any,

    @Body()
    dados: CriarPedidoReemissaoDto,
  ) {
    return this.pedidosReemissaoService.criar(
      request.usuario.sub,
      dados,
    );
  }

  @Get('meus-pedidos')
  @UseGuards(JwtAuthGuard, PerfisGuard)
  @Perfis('ESTUDANTE')
  listarMeusPedidos(
    @Req()
    request: any,
  ) {
    return this.pedidosReemissaoService.listarMeusPedidos(
      request.usuario.sub,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, PerfisGuard)
  @Perfis('ADMIN', 'RESPONSAVEL', 'OPERADOR_CARTAO')
  listarTodos() {
    return this.pedidosReemissaoService.listarTodos();
  }

  @Get('pendentes')
  @UseGuards(JwtAuthGuard, PerfisGuard)
  @Perfis('ADMIN', 'RESPONSAVEL')
  listarPendentes() {
    return this.pedidosReemissaoService.listarPendentes();
  }

  @Post(':id/documento')
  @UseGuards(
    JwtAuthGuard,
    PerfisGuard,
  )
  @Perfis('ESTUDANTE')
  @UseInterceptors(
    FileInterceptor('documento', {
      storage: memoryStorage(),

      limits: {
        fileSize: 5 * 1024 * 1024,
      },

      fileFilter: (
        request,
        file,
        callback,
      ) => {
        if (
          file.mimetype !==
          'application/pdf'
        ) {
          return callback(
            new BadRequestException(
              'Apenas documentos PDF são permitidos.',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  enviarDocumento(
    @Param('id', ParseIntPipe)
    pedidoId: number,

    @Req()
    request: any,

    @UploadedFile()
    arquivo: Express.Multer.File,
  ) {
    if (!arquivo) {
      throw new BadRequestException(
        'O documento PDF é obrigatório.',
      );
    }

    return this.pedidosReemissaoService
      .adicionarDocumento(
        pedidoId,
        request.usuario.sub,
        arquivo,
      );
  }

  @Get(':id/documento')
  @UseGuards(
    JwtAuthGuard,
    PerfisGuard,
  )
  @Perfis(
    'ADMIN',
    'RESPONSAVEL',
    'OPERADOR_CARTAO',
  )
  async visualizarDocumento(
    @Param(
      'id',
      ParseIntPipe,
    )
    pedidoId: number,

    @Res()
    response: Response,
  ) {
    const arquivo =
      await this.pedidosReemissaoService
        .obterDocumento(
          pedidoId,
        );

    response.setHeader(
      'Content-Type',
      'application/pdf',
    );

    response.setHeader(
      'Content-Disposition',
      `inline; filename="documento-reemissao-${pedidoId}.pdf"`,
    );

    return response.sendFile(
      arquivo,
    );
  }

  @Patch(':id/iniciar-analise')
  @UseGuards(JwtAuthGuard, PerfisGuard)
  @Perfis('ADMIN', 'RESPONSAVEL')
  iniciarAnalise(
    @Param('id', ParseIntPipe)
    id: number,

    @Req()
    request: any,
  ) {
    return this.pedidosReemissaoService.iniciarAnalise(
      id,
      request.usuario.sub,
    );
  }

  @Patch(':id/aprovar')
  @UseGuards(JwtAuthGuard, PerfisGuard)
  @Perfis('ADMIN', 'RESPONSAVEL')
  aprovar(
    @Param('id', ParseIntPipe)
    id: number,

    @Req()
    request: any,

    @Body()
    dados: {
      observacao?: string;
    },
  ) {
    const responsavelId =
      request.usuario.sub;

    return this.pedidosReemissaoService.aprovar(
      id,
      responsavelId,
      dados.observacao,
    );
  }

  @Patch(':id/rejeitar')
  @UseGuards(JwtAuthGuard, PerfisGuard)
  @Perfis('ADMIN', 'RESPONSAVEL')
  rejeitar(
    @Param('id', ParseIntPipe)
    id: number,

    @Req()
    request: any,

    @Body()
    dados: RejeitarPedidoDto,
  ) {
    return this.pedidosReemissaoService.rejeitar(
      id,
      request.usuario.sub,
      dados.observacao,
    );
  }

  @Patch(':id/pronto')
  @UseGuards(
    JwtAuthGuard,
    PerfisGuard,
  )
  @Perfis(
    'ADMIN',
    'RESPONSAVEL',
    'OPERADOR_CARTAO',
  )
  marcarComoPronto(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Req()
    request: any,

    @Body()
    dados: MarcarProntoDto,
  ) {
    return this.pedidosReemissaoService.marcarComoPronto(
      id,
      request.usuario.sub,
      dados.localLevantamento,
    );
  }

  @Patch(':id/entregar')
  @UseGuards(
    JwtAuthGuard,
    PerfisGuard,
  )
  @Perfis(
    'ADMIN',
    'RESPONSAVEL',
    'OPERADOR_CARTAO',
  )
  marcarComoEntregue(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Req()
    request: any,
  ) {
    return this.pedidosReemissaoService.marcarComoEntregue(
      id,
      request.usuario.sub,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PerfisGuard)
  @Perfis('ADMIN', 'RESPONSAVEL', 'OPERADOR_CARTAO')
  buscarPorId(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.pedidosReemissaoService.buscarPorId(id);
  }
}
