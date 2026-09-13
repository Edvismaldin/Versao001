import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';

import { UsuariosService } from './usuarios.service.js';
import { CriarUsuarioDto } from './dto/criar-usuario.dto.js';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto.js';
import { JwtAuthGuard } from '../autenticacao/guards/jwt-auth.guard.js';
import { PerfisGuard } from '../autenticacao/guards/perfis.guard.js';
import { Perfis } from '../autenticacao/decorators/perfis.decorator.js';

@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
  ) {}

  @Post('me/foto')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const destino = './uploads/public/usuarios';

          if (!existsSync(destino)) {
            mkdirSync(destino, { recursive: true });
          }

          callback(null, destino);
        },
        filename: (_req, file, callback) => {
          const extensao = extname(file.originalname).toLowerCase();
          const identificador = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

          callback(null, `usuario-${identificador}${extensao}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

        if (!tiposPermitidos.includes(file.mimetype)) {
          return callback(
            new BadRequestException('A fotografia deve ser JPG, PNG ou WEBP.'),
            false,
          );
        }

        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  enviarMinhaFoto(
    @Req() request: any,
    @UploadedFile() foto: Express.Multer.File,
  ) {
    if (!foto) {
      throw new BadRequestException('Nenhuma fotografia foi enviada.');
    }

    return this.usuariosService.salvarFoto(
      request.usuario.sub,
      foto.filename,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, PerfisGuard)
  @Perfis('ADMIN')
  listar() {
    return this.usuariosService.listar();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PerfisGuard)
  @Perfis('ADMIN')
  criar(
    @Body() dados: CriarUsuarioDto,
  ) {
    return this.usuariosService.criar(dados);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PerfisGuard)
  @Perfis('ADMIN')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: AtualizarUsuarioDto,
  ) {
    return this.usuariosService.atualizar(
      id,
      dados,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PerfisGuard)
  @Perfis('ADMIN')
  remover(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: any,
  ) {
    return this.usuariosService.remover(id, request.usuario.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PerfisGuard)
  @Perfis('ADMIN')
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usuariosService.buscarPorId(id);
  }
}
