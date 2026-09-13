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
import { FaculdadesService } from './faculdades.service.js';
import { CriarFaculdadeDto } from './dto/criar-faculdade.dto.js';
import { AtualizarFaculdadeDto } from './dto/atualizar-faculdade.dto.js';

@Controller(['faculdades', 'faculdade'])
export class FaculdadesController {
  constructor(private readonly faculdadesService: FaculdadesService) {}

  @Post()
  criar(@Body() dados: CriarFaculdadeDto) {
    return this.faculdadesService.criar(dados);
  }

  @Get()
  listar() {
    return this.faculdadesService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.faculdadesService.buscarPorId(id);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: AtualizarFaculdadeDto,
  ) {
    return this.faculdadesService.atualizar(id, dados);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.faculdadesService.remover(id);
  }
}
