import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CriarEstudanteDto } from './dto/criar-estudante.dto.js';
import { AtualizarEstudanteDto } from './dto/atualizar-estudante.dto.js';

@Injectable()
export class EstudantesService {
  constructor(private readonly prisma: PrismaService) {}

  private async gerarCodigoAcademico() {
    const ano = new Date().getFullYear();

    for (let tentativa = 0; tentativa < 10; tentativa += 1) {
      const sequencia = Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, '0');

      const codigo = `UCM-${ano}-${sequencia}`;

      const existente = await this.prisma.estudante.findUnique({
        where: { codigo },
        select: { id: true },
      });

      if (!existente) {
        return codigo;
      }
    }

    throw new Error('Não foi possível gerar um código académico único.');
  }

  async criar(dados: CriarEstudanteDto) {
    const curso = await this.prisma.curso.findUnique({
      where: {
        id: dados.cursoId,
      },
    });

    if (!curso) {
      throw new NotFoundException('Curso não encontrado');
    }

    const codigo = await this.gerarCodigoAcademico();

    return this.prisma.estudante.create({
      data: {
        codigo,
        nomeCompleto: dados.nomeCompleto,
        email: dados.email,
        telefone: dados.telefone,

        dataNascimento: dados.dataNascimento
          ? new Date(dados.dataNascimento)
          : undefined,

        sexo: dados.sexo,
        foto: dados.foto,
        ativo: dados.ativo,
        cursoId: dados.cursoId,
      },

      include: {
        curso: {
          include: {
            faculdade: true,
          },
        },
      },
    });
  }

  listar() {
    return this.prisma.estudante.findMany({
      include: {
        curso: {
          include: {
            faculdade: true,
          },
        },
      },

      orderBy: {
        nomeCompleto: 'asc',
      },
    });
  }

  async buscarPorId(id: number) {
    const estudante = await this.prisma.estudante.findUnique({
      where: { id },

      include: {
        curso: {
          include: {
            faculdade: true,
          },
        },
      },
    });

    if (!estudante) {
      throw new NotFoundException('Estudante não encontrado');
    }

    return estudante;
  }

  async buscarFoto(id: number) {
    const estudante = await this.prisma.estudante.findUnique({
      where: { id },
      select: { foto: true },
    });

    if (!estudante) {
      throw new NotFoundException('Estudante não encontrado');
    }

    if (!estudante.foto) {
      throw new NotFoundException('Foto do estudante não encontrada');
    }

    return estudante.foto;
  }

  async salvarFoto(id: number, nomeArquivo: string) {
    await this.buscarPorId(id);

    return this.prisma.estudante.update({
      where: { id },
      data: {
        foto: `/uploads/estudantes/${nomeArquivo}`,
      },
    });
  }

  async atualizar(
    id: number,
    dados: AtualizarEstudanteDto,
  ) {
    await this.buscarPorId(id);

    if (dados.cursoId !== undefined) {
      const curso = await this.prisma.curso.findUnique({
        where: {
          id: dados.cursoId,
        },
      });

      if (!curso) {
        throw new NotFoundException('Curso não encontrado');
      }
    }

    return this.prisma.estudante.update({
      where: { id },

      data: {
        codigo: dados.codigo,
        nomeCompleto: dados.nomeCompleto,
        email: dados.email,
        telefone: dados.telefone,

        dataNascimento:
          dados.dataNascimento !== undefined
            ? new Date(dados.dataNascimento)
            : undefined,

        sexo: dados.sexo,
        foto: dados.foto,
        ativo: dados.ativo,
        cursoId: dados.cursoId,
      },

      include: {
        curso: {
          include: {
            faculdade: true,
          },
        },
      },
    });
  }

  async remover(id: number) {
    await this.buscarPorId(id);

    return this.prisma.estudante.delete({
      where: { id },
    });
  }
}
