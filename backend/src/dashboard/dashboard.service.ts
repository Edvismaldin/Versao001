import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

type UsuarioJwt = { sub: number; perfil: string };
type EstadoPedido =
  | 'PENDENTE'
  | 'EM_ANALISE'
  | 'EM_PRODUCAO'
  | 'PRONTO_LEVANTAMENTO'
  | 'ENTREGUE'
  | 'REJEITADO';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async buscarEstatisticas(usuario: UsuarioJwt) {
    switch (usuario.perfil) {
      case 'ADMIN': return this.dashboardAdmin();
      case 'PROFESSOR': return { perfil: 'PROFESSOR' as const };
      case 'RESPONSAVEL': return this.dashboardResponsavel();
      case 'OPERADOR_CARTAO': return this.dashboardOperador();
      case 'ESTUDANTE': return this.dashboardEstudante(usuario.sub);
      default: throw new ForbiddenException('Perfil sem acesso ao dashboard.');
    }
  }

  private contarPedido(estado: EstadoPedido) {
    return this.prisma.pedidoReemissao.count({ where: { estado } });
  }

  private async dashboardAdmin() {
    const [estudantes, cartoesAtivos, pendentes, emAnalise, emProducao, prontos, entregues, rejeitados] = await Promise.all([
      this.prisma.estudante.count({ where: { ativo: true } }),
      this.prisma.cartaoAcademico.count({ where: { estado: 'ATIVO' } }),
      this.contarPedido('PENDENTE'), this.contarPedido('EM_ANALISE'),
      this.contarPedido('EM_PRODUCAO'), this.contarPedido('PRONTO_LEVANTAMENTO'),
      this.contarPedido('ENTREGUE'), this.contarPedido('REJEITADO'),
    ]);
    return { perfil: 'ADMIN' as const, estudantes, cartoesAtivos,
      reemissoes: { pendentes, emAnalise, emProducao, prontos, entregues, rejeitados } };
  }

  private async dashboardResponsavel() {
    const [pendentes, emAnalise, emProducao, rejeitados] = await Promise.all([
      this.contarPedido('PENDENTE'), this.contarPedido('EM_ANALISE'),
      this.contarPedido('EM_PRODUCAO'), this.contarPedido('REJEITADO'),
    ]);
    return { perfil: 'RESPONSAVEL' as const,
      reemissoes: { pendentes, emAnalise, emProducao, rejeitados } };
  }

  private async dashboardOperador() {
    const [cartoesAtivos, emProducao, prontos, entregues] = await Promise.all([
      this.prisma.cartaoAcademico.count({ where: { estado: 'ATIVO' } }),
      this.contarPedido('EM_PRODUCAO'), this.contarPedido('PRONTO_LEVANTAMENTO'),
      this.contarPedido('ENTREGUE'),
    ]);
    return { perfil: 'OPERADOR_CARTAO' as const, cartoesAtivos,
      producao: { emProducao, prontos, entregues } };
  }

  private async dashboardEstudante(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId }, select: { estudanteId: true },
    });
    if (!usuario?.estudanteId) {
      throw new ForbiddenException('Conta não associada a um estudante.');
    }
    const estudanteId = usuario.estudanteId;
    const [cartao, emAndamento, total] = await Promise.all([
      this.prisma.cartaoAcademico.findFirst({
        where: { estudanteId, estado: 'ATIVO' },
        select: { id: true, numeroCartao: true, estado: true, dataEmissao: true, dataValidade: true },
      }),
      this.prisma.pedidoReemissao.count({
        where: { estudanteId, estado: { in: ['PENDENTE', 'EM_ANALISE', 'EM_PRODUCAO', 'PRONTO_LEVANTAMENTO'] } },
      }),
      this.prisma.pedidoReemissao.count({ where: { estudanteId } }),
    ]);
    return { perfil: 'ESTUDANTE' as const, cartao, pedidos: { emAndamento, total } };
  }
}
