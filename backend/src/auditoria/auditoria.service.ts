import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuditoriaService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  registrar(dados: {
    acao: string;
    modulo: string;
    entidadeId?: number;
    descricao?: string;
    usuarioId?: number;
  }) {
    return this.prisma.auditoria.create({
      data: {
        acao: dados.acao,
        modulo: dados.modulo,
        entidadeId: dados.entidadeId,
        descricao: dados.descricao,
        usuarioId: dados.usuarioId,
      },
    });
  }

  listar() {
    return this.prisma.auditoria.findMany({
      orderBy: {
        criadoEm: 'desc',
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: true,
          },
        },
      },
    });
  }
}