import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CursosService } from './cursos.service.js';
import { CriarCursoDto } from './dto/criar-curso.dto.js';
import { AtualizarCursoDto } from './dto/atualizar-curso.dto.js';

@Controller('cursos')
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @Post()
  criar(@Body() dados: CriarCursoDto) {
    return this.cursosService.criar(dados);
  }

  @Get()
  listar() {
    return this.cursosService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.cursosService.buscarPorId(id);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: AtualizarCursoDto,
  ) {
    return this.cursosService.atualizar(id, dados);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.cursosService.remover(id);
  }
}