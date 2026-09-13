import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AbrirSessaoDto } from './dto/abrir-sessao.dto.js';

type UsuarioJwt = { sub: number; perfil: string };

@Injectable()
export class PresencasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async abrirSessao(dados: AbrirSessaoDto, usuario: UsuarioJwt) {
    const sessaoAberta = await this.prisma.sessaoPresenca.findFirst({
      where: { professorId: usuario.sub, fechadaEm: null },
      select: { id: true, disciplina: true },
    });

    if (sessaoAberta) {
      throw new BadRequestException(
        `Já existe uma aula aberta para este professor: ${sessaoAberta.disciplina}. Feche-a antes de iniciar outra.`,
      );
    }

    const tipo = dados.tipo ?? 'AULA';
    const toleranciaMinutos = dados.toleranciaMinutos ?? 15;
    const limiteEntradaMinutos = dados.limiteEntradaMinutos ?? 30;

    if (limiteEntradaMinutos < toleranciaMinutos) {
      throw new BadRequestException(
        'O limite de entrada deve ser igual ou superior à tolerância de atraso.',
      );
    }

    if (tipo === 'TESTE' && !dados.duracaoMinutos) {
      throw new BadRequestException('Informe a duração do teste em minutos.');
    }

    const sessao = await this.prisma.sessaoPresenca.create({
      data: {
        disciplina: dados.disciplina.trim(),
        turma: dados.turma?.trim() || null,
        tipo,
        horaInicio: this.criarHoraInicio(dados.horaInicio),
        toleranciaMinutos,
        limiteEntradaMinutos,
        duracaoMinutos: tipo === 'TESTE' ? dados.duracaoMinutos : null,
        professorId: usuario.sub,
      },
      include: {
        professor: { select: { id: true, nome: true } },
      },
    });

    await this.auditoria.registrar({
      acao: 'ABRIR_SESSAO_PRESENCA',
      modulo: 'PRESENCAS',
      entidadeId: sessao.id,
      descricao: `${tipo === 'TESTE' ? 'Teste' : 'Aula'} aberta: ${sessao.disciplina}${sessao.turma ? ` (${sessao.turma})` : ''}. Tolerância: ${toleranciaMinutos} min; limite: ${limiteEntradaMinutos} min.`,
      usuarioId: usuario.sub,
    });

    return sessao;
  }

  async fecharSessao(id: number, usuario: UsuarioJwt) {
    const sessao = await this.obterSessao(id);
    this.validarAcesso(sessao, usuario);

    if (sessao.fechadaEm) {
      throw new BadRequestException('Esta sessão de presença já foi fechada.');
    }

    const atualizada = await this.prisma.sessaoPresenca.update({
      where: { id },
      data: { fechadaEm: new Date() },
      include: { _count: { select: { presencas: true } } },
    });

    await this.auditoria.registrar({
      acao: 'FECHAR_SESSAO_PRESENCA',
      modulo: 'PRESENCAS',
      entidadeId: id,
      descricao: `Aula fechada com ${atualizada._count.presencas} presença(s).`,
      usuarioId: usuario.sub,
    });

    return atualizada;
  }

  async registarPresenca(id: number, qrCode: string, usuario: UsuarioJwt) {
    const sessao = await this.obterSessao(id);
    this.validarAcesso(sessao, usuario);

    if (sessao.fechadaEm) {
      throw new BadRequestException('A aula já foi fechada. Não é possível registar presenças.');
    }

    const agora = new Date();
    const minutosDecorridos = Math.max(
      0,
      Math.floor((agora.getTime() - sessao.horaInicio.getTime()) / 60000),
    );

    if (minutosDecorridos > sessao.limiteEntradaMinutos) {
      await this.auditoria.registrar({
        acao: 'ENTRADA_NAO_ADMITIDA',
        modulo: 'PRESENCAS',
        entidadeId: id,
        descricao: `Entrada recusada após ${minutosDecorridos} min na sessão #${id}. Limite: ${sessao.limiteEntradaMinutos} min.`,
        usuarioId: usuario.sub,
      });
      throw new BadRequestException(
        `Entrada não admitida: o limite de ${sessao.limiteEntradaMinutos} minutos foi ultrapassado.`,
      );
    }

    const estado = minutosDecorridos > sessao.toleranciaMinutos
      ? 'ATRASADO'
      : 'PRESENTE';

    const qrToken = this.extrairQrToken(qrCode);
    const cartao = await this.prisma.cartaoAcademico.findUnique({
      where: { qrToken },
      include: { estudante: true },
    });

    if (!cartao) {
      throw new NotFoundException('Cartão académico não encontrado.');
    }

    if (cartao.estado !== 'ATIVO') {
      throw new BadRequestException('Este cartão não está ativo.');
    }

    if (cartao.dataValidade && cartao.dataValidade < new Date()) {
      throw new BadRequestException('Este cartão académico está expirado.');
    }

    if (!cartao.estudante.ativo) {
      throw new BadRequestException('O estudante está inativo.');
    }

    const existente = await this.prisma.presencaAula.findUnique({
      where: {
        sessaoId_estudanteId: {
          sessaoId: id,
          estudanteId: cartao.estudanteId,
        },
      },
      select: { registadaEm: true },
    });

    if (existente) {
      throw new BadRequestException(
        `Presença já registada às ${existente.registadaEm.toLocaleTimeString('pt-PT')}.`,
      );
    }

    const presenca = await this.prisma.presencaAula.create({
      data: {
        sessaoId: id,
        estudanteId: cartao.estudanteId,
        cartaoId: cartao.id,
        estado,
        minutosAtraso: estado === 'ATRASADO' ? minutosDecorridos : 0,
      },
      include: {
        estudante: { select: { id: true, codigo: true, nomeCompleto: true } },
      },
    });

    await this.auditoria.registrar({
      acao: 'REGISTAR_PRESENCA',
      modulo: 'PRESENCAS',
      entidadeId: presenca.id,
      descricao: `${estado === 'ATRASADO' ? 'Atraso' : 'Presença'} de ${presenca.estudante.nomeCompleto} na sessão #${id}${estado === 'ATRASADO' ? ` (${minutosDecorridos} min)` : ''}.`,
      usuarioId: usuario.sub,
    });

    return {
      mensagem: estado === 'ATRASADO'
        ? `Entrada registada com atraso de ${minutosDecorridos} minuto(s).`
        : 'Presença registada com sucesso.',
      presenca,
    };
  }

  async listarPresencas(id: number, usuario: UsuarioJwt) {
    const sessao = await this.obterSessao(id);
    this.validarAcesso(sessao, usuario);

    return this.prisma.sessaoPresenca.findUnique({
      where: { id },
      include: {
        professor: { select: { id: true, nome: true } },
        presencas: {
          orderBy: { registadaEm: 'asc' },
          include: {
            estudante: { select: { id: true, codigo: true, nomeCompleto: true } },
            cartao: { select: { id: true, numeroCartao: true } },
          },
        },
      },
    });
  }

  listarMinhasSessoes(usuario: UsuarioJwt) {
    const where = usuario.perfil === 'ADMIN' ? {} : { professorId: usuario.sub };

    return this.prisma.sessaoPresenca.findMany({
      where,
      orderBy: { abertaEm: 'desc' },
      include: {
        professor: { select: { id: true, nome: true } },
        _count: { select: { presencas: true } },
      },
    });
  }

  private async obterSessao(id: number) {
    const sessao = await this.prisma.sessaoPresenca.findUnique({
      where: { id },
      select: {
        id: true,
        professorId: true,
        fechadaEm: true,
        horaInicio: true,
        toleranciaMinutos: true,
        limiteEntradaMinutos: true,
      },
    });

    if (!sessao) {
      throw new NotFoundException('Sessão de presença não encontrada.');
    }

    return sessao;
  }

  private validarAcesso(sessao: { professorId: number }, usuario: UsuarioJwt) {
    if (usuario.perfil !== 'ADMIN' && sessao.professorId !== usuario.sub) {
      throw new ForbiddenException('Esta sessão pertence a outro professor.');
    }
  }

  private extrairQrToken(qrCode: string) {
    const valor = qrCode.trim();
    const marcador = '/validar/';
    const indice = valor.lastIndexOf(marcador);
    const token = indice >= 0 ? valor.slice(indice + marcador.length) : valor;

    if (!token || !/^[a-f0-9]{32,}$/i.test(token)) {
      throw new BadRequestException('QR Code inválido para presença.');
    }

    return token;
  }

  private criarHoraInicio(hora?: string) {
    if (!hora) return new Date();

    const [horas, minutos] = hora.split(':').map(Number);
    const inicio = new Date();
    inicio.setHours(horas, minutos, 0, 0);
    return inicio;
  }
}
