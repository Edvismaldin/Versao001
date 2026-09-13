import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CriarCursoDto } from './dto/criar-curso.dto.js';
import { AtualizarCursoDto } from './dto/atualizar-curso.dto.js';

@Injectable()
export class CursosService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dados: CriarCursoDto) {
    const faculdade = await this.prisma.faculdade.findUnique({
      where: {
        id: dados.faculdadeId,
      },
    });

    if (!faculdade) {
      throw new NotFoundException('Faculdade não encontrada');
    }

    return this.prisma.curso.create({
      data: dados,
      include: {
        faculdade: true,
      },
    });
  }

  listar() {
    return this.prisma.curso.findMany({
      include: {
        faculdade: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async buscarPorId(id: number) {
    const curso = await this.prisma.curso.findUnique({
      where: { id },
      include: {
        faculdade: true,
      },
    });

    if (!curso) {
      throw new NotFoundException('Curso não encontrado');
    }

    return curso;
  }

  async atualizar(id: number, dados: AtualizarCursoDto) {
    await this.buscarPorId(id);

    if (dados.faculdadeId !== undefined) {
      const faculdade = await this.prisma.faculdade.findUnique({
        where: {
          id: dados.faculdadeId,
        },
      });

      if (!faculdade) {
        throw new NotFoundException('Faculdade não encontrada');
      }
    }

    return this.prisma.curso.update({
      where: { id },
      data: dados,
      include: {
        faculdade: true,
      },
    });
  }

  async remover(id: number) {
    await this.buscarPorId(id);

    return this.prisma.curso.delete({
      where: { id },
    });
  }
}
