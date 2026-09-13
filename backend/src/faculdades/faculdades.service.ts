import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CriarFaculdadeDto } from './dto/criar-faculdade.dto.js';
import { AtualizarFaculdadeDto } from './dto/atualizar-faculdade.dto.js';

@Injectable()
export class FaculdadesService {
  constructor(private readonly prisma: PrismaService) {}

  criar(dados: CriarFaculdadeDto) {
    return this.prisma.faculdade.create({
      data: dados,
    });
  }

  listar() {
    return this.prisma.faculdade.findMany({
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async buscarPorId(id: number) {
    const faculdade = await this.prisma.faculdade.findUnique({
      where: { id },
    });

    if (!faculdade) {
      throw new NotFoundException('Faculdade não encontrada');
    }

    return faculdade;
  }

  async atualizar(id: number, dados: AtualizarFaculdadeDto) {
    await this.buscarPorId(id);

    return this.prisma.faculdade.update({
      where: { id },
      data: dados,
    });
  }

  async remover(id: number) {
    await this.buscarPorId(id);

    return this.prisma.faculdade.delete({
      where: { id },
    });
  }
}
