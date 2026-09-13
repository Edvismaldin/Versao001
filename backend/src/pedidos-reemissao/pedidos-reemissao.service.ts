import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { PrismaService } from '../prisma/prisma.service.js';
import { CartoesService } from '../cartoes/cartoes.service.js';
import { EmailService } from '../email/email.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';

import { CriarPedidoReemissaoDto } from './dto/criar-pedido-reemissao.dto.js';

@Injectable()
export class PedidosReemissaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartoesService: CartoesService,
    private readonly emailService: EmailService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async criar(
    usuarioId: number,
    dados: {
      cartaoId: number;
      motivo: string;
    },
  ) {
    const usuario =
      await this.prisma.usuario.findUnique({
        where: {
          id: usuarioId,
        },

        include: {
          estudante: true,
        },
      });

    if (!usuario || !usuario.ativo) {
      throw new BadRequestException(
        'Usuário inválido ou inativo.',
      );
    }

    if (!usuario.estudante) {
      throw new BadRequestException(
        'A conta não está associada a um estudante.',
      );
    }

    if (!dados.motivo?.trim()) {
      throw new BadRequestException(
        'Informe o motivo da reemissão.',
      );
    }

    const cartao =
      await this.prisma.cartaoAcademico.findUnique({
        where: {
          id: dados.cartaoId,
        },
      });

    if (!cartao) {
      throw new NotFoundException(
        'Cartão não encontrado.',
      );
    }

    if (
      cartao.estudanteId !==
      usuario.estudante.id
    ) {
      throw new ForbiddenException(
        'Este cartão não pertence ao estudante autenticado.',
      );
    }

    if (
      ![
        'ATIVO',
        'BLOQUEADO',
      ].includes(cartao.estado)
    ) {
      throw new BadRequestException(
        'Este cartão não pode solicitar reemissão.',
      );
    }

    const pedidoExistente =
      await this.prisma.pedidoReemissao.findFirst({
        where: {
          estudanteId:
            usuario.estudante.id,

          estado: {
            in: [
              'PENDENTE',
              'EM_ANALISE',
              'APROVADO',
              'EM_PRODUCAO',
              'PRONTO_LEVANTAMENTO',
            ],
          },
        },
      });

    if (pedidoExistente) {
      throw new BadRequestException(
        'Já existe um pedido de reemissão em andamento.',
      );
    }

    const pedido =
      await this.prisma.pedidoReemissao.create({
        data: {
          estudanteId:
            usuario.estudante.id,

          cartaoId:
            dados.cartaoId,

          motivo:
            dados.motivo.trim(),

          estado:
            'PENDENTE',
        },

        include: {
          estudante: true,

          cartao: {
            select: {
              id: true,
              numeroCartao: true,
              estado: true,
            },
          },
        },
      });

    if (pedido.estudante.email) {
      try {
        await this.emailService.enviarEmail(
          pedido.estudante.email,
          'Pedido de reemissão recebido - UCM',
          `
Olá ${pedido.estudante.nomeCompleto},

Recebemos o seu pedido de reemissão do cartão académico.

Pedido: #${pedido.id}

Cartão atual:
${pedido.cartao.numeroCartao}

Motivo informado:
${pedido.motivo}

Estado:
Pendente

O pedido será analisado pelo responsável pelos cartões.

Universidade Católica de Moçambique
          `.trim(),
        );
      } catch (erro) {
        console.error(
          'Pedido criado, mas não foi possível enviar o email.',
        );
      }
    }

    return pedido;
  }

  private validarPdf(
    arquivo: Express.Multer.File,
  ) {
    if (
      arquivo.mimetype !==
      'application/pdf'
    ) {
      throw new BadRequestException(
        'Tipo de arquivo inválido.',
      );
    }

    if (
      !arquivo.buffer ||
      arquivo.buffer.length < 5
    ) {
      throw new BadRequestException(
        'Documento PDF inválido.',
      );
    }

    const assinatura =
      arquivo.buffer
        .subarray(0, 5)
        .toString('ascii');

    if (assinatura !== '%PDF-') {
      throw new BadRequestException(
        'O arquivo enviado não é um PDF válido.',
      );
    }
  }

  async adicionarDocumento(
    pedidoId: number,
    usuarioId: number,
    arquivo: Express.Multer.File,
  ) {
    const usuario =
      await this.prisma.usuario.findUnique({
        where: {
          id: usuarioId,
        },
        select: {
          estudanteId: true,
          ativo: true,
        },
      });

    if (
      !usuario ||
      !usuario.ativo ||
      !usuario.estudanteId
    ) {
      throw new ForbiddenException(
        'Conta de estudante inválida.',
      );
    }

    const pedido =
      await this.prisma
        .pedidoReemissao
        .findUnique({
          where: {
            id: pedidoId,
          },
          select: {
            id: true,
            estudanteId: true,
            estado: true,
            documento: true,
          },
        });

    if (!pedido) {
      throw new NotFoundException(
        'Pedido de reemissão não encontrado.',
      );
    }

    if (
      pedido.estudanteId !==
      usuario.estudanteId
    ) {
      throw new ForbiddenException(
        'Você não pode adicionar documentos a este pedido.',
      );
    }

    if (
      pedido.estado !== 'PENDENTE'
    ) {
      throw new BadRequestException(
        'O documento só pode ser alterado enquanto o pedido estiver pendente.',
      );
    }

    this.validarPdf(arquivo);

    const pasta = join(
      process.cwd(),
      'uploads',
      'private',
      'reemissoes',
      'documentos',
    );

    await mkdir(
      pasta,
      {
        recursive: true,
      },
    );

    const nomeArquivo =
      `${randomUUID()}.pdf`;

    const caminho =
      join(
        pasta,
        nomeArquivo,
      );

    await writeFile(
      caminho,
      arquivo.buffer,
    );

    try {
      const pedidoAtualizado =
        await this.prisma
          .pedidoReemissao
          .update({
            where: {
              id: pedidoId,
            },
            data: {
              documento:
                nomeArquivo,
            },
          });

      if (pedido.documento) {
        const antigo = join(
          pasta,
          pedido.documento,
        );

        await unlink(antigo)
          .catch(() => undefined);
      }

      return {
        mensagem:
          'Documento enviado com sucesso.',
        pedido:
          pedidoAtualizado,
      };
    } catch (erro) {
      await unlink(caminho)
        .catch(() => undefined);

      throw erro;
    }
  }

  async obterDocumento(
    pedidoId: number,
  ) {
    const pedido =
      await this.prisma
        .pedidoReemissao
        .findUnique({
          where: {
            id: pedidoId,
          },
          select: {
            documento: true,
          },
        });

    if (!pedido) {
      throw new NotFoundException(
        'Pedido não encontrado.',
      );
    }

    if (!pedido.documento) {
      throw new NotFoundException(
        'Este pedido não possui documento.',
      );
    }

    return join(
      process.cwd(),
      'uploads',
      'private',
      'reemissoes',
      'documentos',
      pedido.documento,
    );
  }

  async listarMeusPedidos(usuarioId: number) {
    const usuario =
      await this.prisma.usuario.findUnique({
        where: {
          id: usuarioId,
        },

        include: {
          estudante: true,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'Usuário não encontrado.',
      );
    }

    if (!usuario.ativo) {
      throw new BadRequestException(
        'Usuário inativo.',
      );
    }

    if (!usuario.estudante) {
      throw new BadRequestException(
        'Este usuário não está associado a um estudante.',
      );
    }

    return this.prisma.pedidoReemissao.findMany({
      where: {
        estudanteId: usuario.estudante.id,
      },

      orderBy: {
        criadoEm: 'desc',
      },

      select: {
        id: true,
        motivo: true,
        documento: true,
        estado: true,
        observacao: true,
        localLevantamento: true,
        prontoEm: true,
        entregueEm: true,
        analisadoEm: true,
        concluidoEm: true,
        criadoEm: true,
        atualizadoEm: true,

        cartao: {
          select: {
            id: true,
            numeroCartao: true,
            estado: true,
            dataEmissao: true,
            dataValidade: true,
          },
        },

        responsavel: {
          select: {
            nome: true,
          },
        },
      },
    });
  }

  async listarTodos() {
    return this.prisma.pedidoReemissao.findMany({
      orderBy: {
        criadoEm: 'desc',
      },
      include: {
        estudante: {
          select: {
            id: true,
            codigo: true,
            nomeCompleto: true,
            email: true,
          },
        },
        cartao: {
          select: {
            id: true,
            numeroCartao: true,
            estado: true,
          },
        },
        responsavel: {
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

  async listarPendentes() {
    return this.prisma.pedidoReemissao.findMany({
      where: {
        concluidoEm: null,
        entregueEm: null,
        estado: {
          in: ['PENDENTE', 'EM_ANALISE'],
        },
      },
      orderBy: {
        criadoEm: 'asc',
      },
      include: {
        estudante: {
          select: {
            id: true,
            codigo: true,
            nomeCompleto: true,
            email: true,
          },
        },
        cartao: {
          select: {
            id: true,
            numeroCartao: true,
            estado: true,
          },
        },
        responsavel: {
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

  async buscarPorId(id: number) {
    const pedido =
      await this.prisma.pedidoReemissao.findUnique({
        where: {
          id,
        },
        include: {
          estudante: {
            select: {
              id: true,
              codigo: true,
              nomeCompleto: true,
              email: true,
            },
          },
          cartao: {
            select: {
              id: true,
              numeroCartao: true,
              estado: true,
            },
          },
          responsavel: {
            select: {
              id: true,
              nome: true,
              email: true,
              perfil: true,
            },
          },
        },
      });

    if (!pedido) {
      throw new NotFoundException(
        'Pedido de reemissão não encontrado.',
      );
    }

    return pedido;
  }

  async iniciarAnalise(
    id: number,
    responsavelId: number,
  ) {
    const pedido =
      await this.prisma.pedidoReemissao.findUnique({
        where: { id },

        include: {
          estudante: true,
          cartao: true,
        },
      });

    if (!pedido) {
      throw new NotFoundException(
        'Pedido de reemissão não encontrado.',
      );
    }

    if (pedido.estado !== 'PENDENTE') {
      throw new BadRequestException(
        'Somente pedidos pendentes podem entrar em análise.',
      );
    }

    const responsavel =
      await this.prisma.usuario.findUnique({
        where: {
          id: responsavelId,
        },
      });

    if (!responsavel || !responsavel.ativo) {
      throw new BadRequestException(
        'Responsável inválido ou inativo.',
      );
    }

    const pedidoAtualizado =
      await this.prisma.pedidoReemissao.update({
        where: { id },

        data: {
          estado: 'EM_ANALISE',
          responsavelId,
          analisadoEm: new Date(),
        },

        include: {
          estudante: true,

          cartao: {
            select: {
              id: true,
              numeroCartao: true,
              estado: true,
            },
          },

          responsavel: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

    // O pedido já foi atualizado.
    // Uma falha no email não desfaz a operação.
    if (pedidoAtualizado.estudante.email) {
      try {
        await this.emailService.enviarEmail(
          pedidoAtualizado.estudante.email,

          'Pedido de reemissão em análise - UCM',

          `
Olá ${pedidoAtualizado.estudante.nomeCompleto},

O seu pedido de reemissão do cartão académico está agora em análise.

Pedido: #${pedidoAtualizado.id}

Cartão:
${pedidoAtualizado.cartao.numeroCartao}

Estado:
Em análise

O responsável pelos cartões está a verificar a sua solicitação e o documento enviado.

Você será informado quando houver uma nova atualização.

Universidade Católica de Moçambique
          `.trim(),
        );
      } catch (erro) {
        console.error(
          `Pedido #${pedidoAtualizado.id} colocado em análise, mas o email não pôde ser enviado.`,
        );
      }
    }

    await this.auditoriaService.registrar({
      acao: 'INICIAR_ANALISE_REEMISSAO',
      modulo: 'REEMISSAO',
      entidadeId: id,
      usuarioId: responsavelId,
      descricao:
        `Análise iniciada para o pedido ${id}.`,
    });

    return pedidoAtualizado;
  }

  async rejeitar(
    id: number,
    responsavelId: number,
    observacao: string,
  ) {
    const pedido =
      await this.prisma.pedidoReemissao.findUnique({
        where: { id },
        include: {
          estudante: true,
          cartao: true,
        },
      });

    if (!pedido) {
      throw new NotFoundException(
        'Pedido de reemissão não encontrado.',
      );
    }

    if (
      ![
        'PENDENTE',
        'EM_ANALISE',
      ].includes(pedido.estado)
    ) {
      throw new BadRequestException(
        'Este pedido não pode ser rejeitado neste estado.',
      );
    }

    if (!observacao?.trim()) {
      throw new BadRequestException(
        'Informe o motivo da rejeição.',
      );
    }

    const responsavel =
      await this.prisma.usuario.findUnique({
        where: {
          id: responsavelId,
        },
      });

    if (!responsavel || !responsavel.ativo) {
      throw new BadRequestException(
        'Responsável inválido ou inativo.',
      );
    }

    const pedidoAtualizado =
      await this.prisma.pedidoReemissao.update({
        where: {
          id,
        },

        data: {
          estado: 'REJEITADO',
          responsavelId,
          observacao:
            observacao.trim(),
          analisadoEm:
            pedido.analisadoEm ??
            new Date(),
          concluidoEm:
            new Date(),
        },

        include: {
          estudante: true,

          cartao: {
            select: {
              id: true,
              numeroCartao: true,
              estado: true,
            },
          },

          responsavel: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

    if (
      pedidoAtualizado.estudante.email
    ) {
      try {
        await this.emailService.enviarEmail(
          pedidoAtualizado.estudante.email,

          'Pedido de reemissão rejeitado - UCM',

          `
Olá ${pedidoAtualizado.estudante.nomeCompleto},

O seu pedido de reemissão do cartão académico foi analisado e não foi aprovado.

Pedido:
#${pedidoAtualizado.id}

Cartão:
${pedidoAtualizado.cartao.numeroCartao}

Motivo da rejeição:
${pedidoAtualizado.observacao}

Se necessário, entre em contacto com o setor responsável pelos cartões académicos.

Universidade Católica de Moçambique
          `.trim(),
        );
      } catch {
        console.error(
          `Pedido #${pedidoAtualizado.id} rejeitado, mas o email não foi enviado.`,
        );
      }
    }

    await this.auditoriaService.registrar({
      acao: 'REJEITAR_REEMISSAO',
      modulo: 'REEMISSAO',
      entidadeId: id,
      usuarioId: responsavelId,
      descricao:
        `Pedido ${id} rejeitado.`,
    });

    return pedidoAtualizado;
  }

  private async gerarNumeroCartao(tx?: any): Promise<string> {
    const client = tx || this.prisma;
    while (true) {
      const ano = new Date().getFullYear();
      const numeroAleatorio = Math.floor(
        100000 + Math.random() * 900000,
      );
      const numeroCartao = `UCM-${ano}-${numeroAleatorio}`;

      const existente = await client.cartaoAcademico.findUnique({
        where: {
          numeroCartao,
        },
      });

      if (!existente) {
        return numeroCartao;
      }
    }
  }

  async aprovar(
    id: number,
    responsavelId: number,
    observacao?: string,
  ) {
    const responsavel =
      await this.prisma.usuario.findUnique({
        where: {
          id: responsavelId,
        },
      });

    if (!responsavel || !responsavel.ativo) {
      throw new BadRequestException(
        'Responsável inválido ou inativo.',
      );
    }

    const resultado = await this.prisma.$transaction(
      async (tx) => {
        const pedido =
          await tx.pedidoReemissao.findUnique({
            where: {
              id,
            },
            include: {
              cartao: true,
              estudante: true,
            },
          });

        if (!pedido) {
          throw new NotFoundException(
            'Pedido de reemissão não encontrado.',
          );
        }

        if (
          pedido.estado !== 'PENDENTE' &&
          pedido.estado !== 'EM_ANALISE'
        ) {
          throw new BadRequestException(
            'Apenas pedidos pendentes ou em análise podem ser aprovados.',
          );
        }

        if (
          pedido.cartao.estado !== 'ATIVO' &&
          pedido.cartao.estado !== 'BLOQUEADO'
        ) {
          throw new BadRequestException(
            'O cartão associado a este pedido não pode ser reemitido.',
          );
        }

        // Verifica se já existe outro cartão ATIVO para este estudante que não seja este cartão do pedido
        const outroCartaoAtivo = await tx.cartaoAcademico.findFirst({
          where: {
            estudanteId: pedido.estudanteId,
            estado: 'ATIVO',
            id: {
              not: pedido.cartaoId,
            },
          },
        });

        if (outroCartaoAtivo) {
          throw new BadRequestException(
            'O estudante já possui outro cartão académico ativo.',
          );
        }

        // 1. Atualiza cartão anterior para REEMITIDO
        const cartaoAnteriorAtualizado =
          await tx.cartaoAcademico.update({
            where: {
              id: pedido.cartaoId,
            },
            data: {
              estado: 'REEMITIDO',
              bloqueadoEm:
                pedido.cartao.bloqueadoEm ?? new Date(),
              motivoBloqueio:
                pedido.motivo?.trim() || 'Reemissão aprovada',
            },
          });

        // 2. Gera identificadores para o novo cartão
        const numeroCartao = await this.gerarNumeroCartao(tx);
        const qrToken = randomBytes(24).toString('hex');

        // 3. Cria novo cartão ativo ligado ao anterior
        const novoCartao = await tx.cartaoAcademico.create({
          data: {
            numeroCartao,
            qrToken,
            estado: 'ATIVO',
            estudanteId: pedido.estudanteId,
            dataValidade: pedido.cartao.dataValidade,
            cartaoAnteriorId: pedido.cartao.id,
          },
          include: {
            estudante: {
              include: {
                curso: {
                  include: {
                    faculdade: true,
                  },
                },
              },
            },
            cartaoAnterior: true,
          },
        });

        // 4. Atualiza o pedido para EM_PRODUCAO com data de análise e responsável
        const pedidoAtualizado =
          await tx.pedidoReemissao.update({
            where: {
              id,
            },
            data: {
              estado: 'EM_PRODUCAO',
              responsavelId,
              observacao:
                observacao?.trim() ||
                'Pedido aprovado. Cartão enviado para produção.',
              analisadoEm:
                pedido.analisadoEm ?? new Date(),
            },
            include: {
              estudante: true,
              cartao: {
                select: {
                  id: true,
                  numeroCartao: true,
                  estado: true,
                },
              },
              responsavel: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                  perfil: true,
                },
              },
            },
          });

        return {
          pedidoAtualizado,
          cartaoAnterior: {
            id: cartaoAnteriorAtualizado.id,
            numeroCartao: cartaoAnteriorAtualizado.numeroCartao,
            estado: cartaoAnteriorAtualizado.estado,
          },
          novoCartao,
        };
      },
    );

    // Envio de email fora da transação para não falhar nem abortar o commit
    if (resultado.pedidoAtualizado.estudante.email) {
      try {
        await this.emailService.enviarEmail(
          resultado.pedidoAtualizado.estudante.email,
          'Pedido aprovado - Cartão em produção',
          `
Olá ${resultado.pedidoAtualizado.estudante.nomeCompleto},

O seu pedido de reemissão do cartão académico foi aprovado.

Pedido: #${resultado.pedidoAtualizado.id}

Novo cartão:
${resultado.novoCartao.numeroCartao}

Estado:
Em produção

O novo cartão está sendo preparado.

Você receberá outra mensagem quando estiver pronto para levantamento.

Universidade Católica de Moçambique
          `.trim(),
        );
      } catch {
        console.error(
          `Pedido #${resultado.pedidoAtualizado.id} aprovado, mas o email não foi enviado.`,
        );
      }
    }

    await this.auditoriaService.registrar({
      acao: 'APROVAR_REEMISSAO',
      modulo: 'REEMISSAO',
      entidadeId: id,
      usuarioId: responsavelId,
      descricao:
        `Pedido ${id} aprovado e novo cartão emitido.`,
    });

    return {
      mensagem:
        'Pedido aprovado e cartão enviado para produção com sucesso.',
      pedido: resultado.pedidoAtualizado,
      reemissao: {
        cartaoAnterior: resultado.cartaoAnterior,
        novoCartao: resultado.novoCartao,
      },
    };
  }

  async marcarComoPronto(
    id: number,
    responsavelId: number,
    localLevantamento: string,
  ) {
    const pedido =
      await this.prisma.pedidoReemissao.findUnique({
        where: { id },

        include: {
          estudante: true,
          cartao: true,
        },
      });

    if (!pedido) {
      throw new NotFoundException(
        'Pedido de reemissão não encontrado.',
      );
    }

    if (pedido.estado !== 'EM_PRODUCAO') {
      throw new BadRequestException(
        'Somente pedidos em produção podem ser marcados como prontos.',
      );
    }

    if (!localLevantamento?.trim()) {
      throw new BadRequestException(
        'Informe o local de levantamento.',
      );
    }

    const responsavel =
      await this.prisma.usuario.findUnique({
        where: {
          id: responsavelId,
        },
      });

    if (!responsavel || !responsavel.ativo) {
      throw new BadRequestException(
        'Responsável inválido ou inativo.',
      );
    }

    const pedidoAtualizado =
      await this.prisma.pedidoReemissao.update({
        where: {
          id,
        },

        data: {
          estado: 'PRONTO_LEVANTAMENTO',
          responsavelId,
          localLevantamento:
            localLevantamento.trim(),
          prontoEm: new Date(),
        },

        include: {
          estudante: {
            select: {
              id: true,
              codigo: true,
              nomeCompleto: true,
              email: true,
            },
          },

          cartao: {
            select: {
              id: true,
              numeroCartao: true,
              estado: true,
            },
          },

          responsavel: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

    if (pedidoAtualizado.estudante.email) {
      try {
        await this.emailService.enviarEmail(
          pedidoAtualizado.estudante.email,

          'Seu cartão académico está pronto - UCM',

          `
Olá ${pedidoAtualizado.estudante.nomeCompleto},

O seu novo cartão académico está pronto para levantamento.

Pedido:
#${pedidoAtualizado.id}

Número do cartão:
${pedidoAtualizado.cartao.numeroCartao}

Local de levantamento:
${pedidoAtualizado.localLevantamento}

Estado:
Pronto para levantamento

Dirija-se ao local indicado para receber o seu cartão académico.

Universidade Católica de Moçambique
          `.trim(),
        );
      } catch {
        console.error(
          `Pedido #${pedidoAtualizado.id} foi marcado como pronto, mas o email não foi enviado.`,
        );
      }
    }

    await this.auditoriaService.registrar({
      acao: 'MARCAR_CARTAO_PRONTO',
      modulo: 'REEMISSAO',
      entidadeId: id,
      usuarioId: responsavelId,
      descricao:
        `Cartão do pedido ${id} marcado como pronto para levantamento.`,
    });

    return pedidoAtualizado;
  }

  async marcarComoEntregue(
    id: number,
    responsavelId: number,
  ) {
    const pedido =
      await this.prisma.pedidoReemissao.findUnique({
        where: { id },

        include: {
          estudante: true,
          cartao: true,
        },
      });

    if (!pedido) {
      throw new NotFoundException(
        'Pedido de reemissão não encontrado.',
      );
    }

    if (pedido.estado !== 'PRONTO_LEVANTAMENTO') {
      throw new BadRequestException(
        'Somente pedidos prontos para levantamento podem ser marcados como entregues.',
      );
    }

    const responsavel =
      await this.prisma.usuario.findUnique({
        where: {
          id: responsavelId,
        },
      });

    if (!responsavel || !responsavel.ativo) {
      throw new BadRequestException(
        'Responsável inválido ou inativo.',
      );
    }

    const agora = new Date();

    const pedidoAtualizado =
      await this.prisma.pedidoReemissao.update({
        where: { id },

        data: {
          estado: 'ENTREGUE',
          responsavelId,
          entregueEm: agora,
          concluidoEm: agora,
        },

        include: {
          estudante: {
            select: {
              id: true,
              codigo: true,
              nomeCompleto: true,
              email: true,
            },
          },

          cartao: {
            select: {
              id: true,
              numeroCartao: true,
              estado: true,
            },
          },

          responsavel: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

    if (pedidoAtualizado.estudante.email) {
      try {
        await this.emailService.enviarEmail(
          pedidoAtualizado.estudante.email,

          'Entrega do cartão académico confirmada - UCM',

          `
Olá ${pedidoAtualizado.estudante.nomeCompleto},

Confirmamos que a entrega do seu novo cartão académico foi registada com sucesso.

Pedido:
#${pedidoAtualizado.id}

Número do cartão:
${pedidoAtualizado.cartao.numeroCartao}

Estado:
Entregue

Data da entrega:
${agora.toLocaleDateString('pt-PT')}

Guarde o seu cartão académico em segurança.

Universidade Católica de Moçambique
          `.trim(),
        );
      } catch {
        console.error(
          `Pedido #${pedidoAtualizado.id} foi concluído, mas o email de confirmação não foi enviado.`,
        );
      }
    }

    await this.auditoriaService.registrar({
      acao: 'ENTREGAR_CARTAO',
      modulo: 'REEMISSAO',
      entidadeId: id,
      usuarioId: responsavelId,
      descricao:
        `Cartão do pedido ${id} entregue ao estudante.`,
    });

    return pedidoAtualizado;
  }
}
