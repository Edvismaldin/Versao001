import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Redirect,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

import { EstudantesService } from './estudantes.service.js';
import { CriarEstudanteDto } from './dto/criar-estudante.dto.js';
import { AtualizarEstudanteDto } from './dto/atualizar-estudante.dto.js';

@Controller('estudantes')
export class EstudantesController {
  constructor(
    private readonly estudantesService: EstudantesService,
  ) {}

  @Post()
  criar(@Body() dados: CriarEstudanteDto) {
    return this.estudantesService.criar(dados);
  }

  @Post(':id/foto')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const destino = './uploads/public/estudantes';

          if (!existsSync(destino)) {
            mkdirSync(destino, { recursive: true });
          }

          callback(null, destino);
        },
        filename: (_req, file, callback) => {
          const nomeUnico = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extensao = extname(file.originalname).toLowerCase();

          callback(null, `estudante-${nomeUnico}${extensao}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        const permitido = ['image/jpeg', 'image/png', 'image/webp'];

        if (!permitido.includes(file.mimetype)) {
          return callback(
            new BadRequestException('A fotografia deve ser JPG, PNG ou WEBP'),
            false,
          );
        }

        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadFoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() foto: Express.Multer.File,
  ) {
    if (!foto) {
      throw new BadRequestException('Nenhuma fotografia foi enviada');
    }

    return this.estudantesService.salvarFoto(id, foto.filename);
  }

  @Get()
  listar() {
    return this.estudantesService.listar();
  }

  @Get(':id/foto')
  @Redirect()
  async buscarFoto(@Param('id', ParseIntPipe) id: number) {
    const foto = await this.estudantesService.buscarFoto(id);

    return {
      url: foto.startsWith('/uploads/') ? foto : `/uploads/${foto}`,
    };
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.estudantesService.buscarPorId(id);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: AtualizarEstudanteDto,
  ) {
    return this.estudantesService.atualizar(
      id,
      dados,
    );
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.estudantesService.remover(id);
  }
}
