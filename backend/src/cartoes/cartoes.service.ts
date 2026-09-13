import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import PDFDocument from 'pdfkit';

import { PrismaService } from '../prisma/prisma.service.js';
import { CriarCartaoDto } from './dto/criar-cartao.dto.js';
import QRCode from 'qrcode';
import { AuditoriaService } from '../auditoria/auditoria.service.js';

type UsuarioJwt = {
  sub: number;
  perfil: string;
};

type CartaoComDados = Awaited<
  ReturnType<CartoesService['buscarPorId']>
>;

@Injectable()
export class CartoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async criar(dados: CriarCartaoDto, usuarioId?: number) {
    const estudante = await this.prisma.estudante.findUnique({
      where: {
        id: dados.estudanteId,
      },
    });

    if (!estudante) {
      throw new NotFoundException('Estudante não encontrado');
    }

    const cartaoAtivo = await this.prisma.cartaoAcademico.findFirst({
      where: {
        estudanteId: dados.estudanteId,
        estado: 'ATIVO',
      },
    });

    if (cartaoAtivo) {
      throw new ConflictException(
        'Este estudante já possui um cartão académico ativo',
      );
    }

    const numeroCartao = await this.gerarNumeroCartao();

    const qrToken = randomBytes(24).toString('hex');

    const cartao = await this.prisma.cartaoAcademico.create({
      data: {
        numeroCartao,
        qrToken,
        estudanteId: dados.estudanteId,

        dataValidade: dados.dataValidade
          ? new Date(dados.dataValidade)
          : undefined,

        estado: 'ATIVO',
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
      },
    });

    await this.auditoriaService.registrar({
      acao: 'EMITIR_CARTAO',
      modulo: 'CARTOES',
      entidadeId: cartao.id,
      usuarioId,
      descricao: `Cartão ${cartao.numeroCartao} emitido para ${cartao.estudante.nomeCompleto}.`,
    });

    return cartao;
  }

  listar() {
    return this.prisma.cartaoAcademico.findMany({
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
      },

      orderBy: {
        criadoEm: 'desc',
      },
    });

  }

  async historicoPorEstudante(estudanteId: number) {
    const estudante =
      await this.prisma.estudante.findUnique({
        where: {
          id: estudanteId,
        },

        select: {
          id: true,
          codigo: true,
          nomeCompleto: true,
        },
      });

    if (!estudante) {
      throw new NotFoundException(
        'Estudante não encontrado.',
      );
    }

    const cartoes =
      await this.prisma.cartaoAcademico.findMany({
        where: {
          estudanteId,
        },

        orderBy: {
          dataEmissao: 'desc',
        },

        select: {
          id: true,
          numeroCartao: true,
          estado: true,
          dataEmissao: true,
          dataValidade: true,
          bloqueadoEm: true,
          motivoBloqueio: true,
          cartaoAnteriorId: true,
        },
      });

    return {
      estudante,
      total: cartoes.length,
      cartoes,
    };
  }

  async buscarPorId(id: number) {
    const cartao = await this.prisma.cartaoAcademico.findUnique({
      where: { id },

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
      },
    });

    if (!cartao) {
      throw new NotFoundException('Cartão académico não encontrado');
    }

    return cartao;
  }

  async buscarPorToken(qrToken: string) {
    const cartao = await this.prisma.cartaoAcademico.findUnique({
      where: {
        qrToken,
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
      },
    });

    if (!cartao) {
      throw new NotFoundException('Cartão inválido');
    }

    return cartao;
  }

  async validarCartao(qrToken: string) {
    const cartao = await this.prisma.cartaoAcademico.findUnique({
      where: { qrToken },
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
      },
    });

    if (!cartao) {
      return {
        valido: false,
        mensagem: 'Cartão académico não encontrado',
      };
    }

    if (cartao.estado === 'BLOQUEADO') {
      return {
        valido: false,
        mensagem: 'Cartão académico bloqueado',
        estado: cartao.estado,
      };
    }

    if (cartao.estado === 'REEMITIDO') {
      return {
        valido: false,
        mensagem: 'Este cartão académico foi substituído',
        estado: cartao.estado,
      };
    }

    if (
      cartao.dataValidade &&
      cartao.dataValidade < new Date()
    ) {
      return {
        valido: false,
        mensagem: 'Cartão académico expirado',
        estado: 'EXPIRADO',
      };
    }

    if (!cartao.estudante.ativo) {
      return {
        valido: false,
        mensagem: 'Estudante inativo',
      };
    }

    return {
      valido: true,
      mensagem: 'Cartão académico válido',
      cartao: {
        numero: cartao.numeroCartao,
        estado: cartao.estado,
        dataEmissao: cartao.dataEmissao,
        dataValidade: cartao.dataValidade,
      },
      estudante: {
        codigo: cartao.estudante.codigo,
        nomeCompleto: cartao.estudante.nomeCompleto,
        foto: cartao.estudante.foto,
        curso: {
          nome: cartao.estudante.curso.nome,
          faculdade: {
            nome: cartao.estudante.curso.faculdade.nome,
            sigla: cartao.estudante.curso.faculdade.sigla,
          },
        },
      },
    };
  }

  async gerarQrCode(id: number) {
    const cartao = await this.buscarPorId(id);
    const baseUrl = (
      process.env.APP_URL ??
      'http://localhost:3000'
    ).replace(/\/$/, '');

    const urlValidacao =
      `${baseUrl}/validar/${cartao.qrToken}`;
    const qrCode = await QRCode.toDataURL(urlValidacao);

    return {
      numeroCartao: cartao.numeroCartao,
      urlValidacao,
      qrCode,
    };
  }

  async gerarPdf(id: number, usuario: UsuarioJwt) {
    const cartao = await this.buscarPorId(id);

    if (usuario.perfil === 'ESTUDANTE') {
      const conta = await this.prisma.usuario.findUnique({
        where: {
          id: usuario.sub,
        },
        select: {
          estudanteId: true,
        },
      });

      if (conta?.estudanteId !== cartao.estudanteId) {
        throw new ForbiddenException(
          'Este cartão não pertence ao estudante autenticado.',
        );
      }
    }

    const baseUrl = (
      process.env.APP_URL ??
      'http://localhost:3000'
    ).replace(/\/$/, '');

    const urlValidacao =
      `${baseUrl}/validar/${cartao.qrToken}`;

    const qrCode = await QRCode.toDataURL(
      urlValidacao,
      {
        margin: 4,
        width: 420,
      },
    );

    const bufferQrCode = Buffer.from(
      qrCode.split(',')[1],
      'base64',
    );

    const documento = new PDFDocument({
      size: [242.65, 153.07], // CR80: 85.6mm × 54mm em pontos
      margin: 0,
      info: {
        Title: `Cartão académico ${cartao.numeroCartao}`,
        Author: 'UCM Card',
        Subject: 'Cartão académico para impressão',
      },
    });

    const partes: Buffer[] = [];

    const pronto = new Promise<Buffer>((resolve, reject) => {
      documento.on('data', (parte: Buffer) => partes.push(parte));
      documento.on('end', () => resolve(Buffer.concat(partes)));
      documento.on('error', reject);
    });

    this.desenharCartaoFrente(documento, cartao);
    this.desenharCartaoVerso(
      documento,
      cartao,
      bufferQrCode,
      urlValidacao,
    );

    documento.end();

    return {
      nomeArquivo:
        `cartao-${cartao.numeroCartao}.pdf`.replace(
          /[^a-zA-Z0-9.-]/g,
          '-',
        ),
      buffer: await pronto,
    };
  }

  async gerarPdfLote(ids: string | undefined, usuario: UsuarioJwt) {
    if (usuario.perfil === 'ESTUDANTE') {
      throw new ForbiddenException(
        'Estudantes nÃ£o podem gerar impressÃ£o em lote.',
      );
    }

    const idsCartoes = this.normalizarIdsLote(ids);

    if (idsCartoes.length > 100) {
      throw new BadRequestException(
        'Selecione no mÃ¡ximo 100 cartÃµes por lote.',
      );
    }

    const cartoes = await this.prisma.cartaoAcademico.findMany({
      where: idsCartoes.length
        ? {
            id: {
              in: idsCartoes,
            },
          }
        : {
            estado: 'ATIVO',
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
      },

      orderBy: {
        criadoEm: 'desc',
      },
    });

    if (!cartoes.length) {
      throw new NotFoundException(
        'Nenhum cartÃ£o encontrado para impressÃ£o.',
      );
    }

    if (idsCartoes.length && cartoes.length !== idsCartoes.length) {
      throw new BadRequestException(
        'Um ou mais cartÃµes selecionados nÃ£o foram encontrados.',
      );
    }

    const documento = new PDFDocument({
      size: [242.65, 153.07], // CR80: 85.6mm × 54mm em pontos
      margin: 0,
      info: {
        Title: 'Lote de cartões académicos',
        Author: 'UCM Card',
        Subject: 'Cartões académicos para impressão em lote',
      },
    });

    const partes: Buffer[] = [];

    const pronto = new Promise<Buffer>((resolve, reject) => {
      documento.on('data', (parte: Buffer) => partes.push(parte));
      documento.on('end', () => resolve(Buffer.concat(partes)));
      documento.on('error', reject);
    });

    for (const [indice, cartao] of cartoes.entries()) {
      if (indice > 0) {
        documento.addPage();
      }

      const baseUrl = (
        process.env.APP_URL ??
        'http://localhost:3000'
      ).replace(/\/$/, '');

      const urlValidacao =
        `${baseUrl}/validar/${cartao.qrToken}`;

      const qrCode = await QRCode.toDataURL(
        urlValidacao,
        {
          margin: 4,
          width: 420,
        },
      );

      const bufferQrCode = Buffer.from(
        qrCode.split(',')[1],
        'base64',
      );

      this.desenharCartaoFrente(documento, cartao);
      this.desenharCartaoVerso(
        documento,
        cartao,
        bufferQrCode,
        urlValidacao,
      );
    }

    documento.end();

    return {
      nomeArquivo: `cartoes-lote-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`,
      buffer: await pronto,
    };
  }

  private normalizarIdsLote(ids?: string) {
    if (!ids?.trim()) {
      return [];
    }

    const valores = ids
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);

    return Array.from(new Set(valores));
  }

  private desenharCartaoFrente(
    documento: any,
    cartao: CartaoComDados,
  ) {
    const largura = documento.page.width;
    const altura = documento.page.height;
    const x = 0;
    const y = 0;
    const azul = '#003B71';
    const azulEscuro = '#00284D';
    const ouro = '#C9A227';

    // Fundo branco do cartão com moldura discreta para impressão CR80.
    documento.rect(x, y, largura, altura).fill('#FFFFFF');
    documento.rect(x + 1, y + 1, largura - 2, altura - 2)
      .strokeColor('#D7E2EE')
      .lineWidth(0.7)
      .stroke();

    // Identidade UCM: azul institucional, com o dourado apenas como acento.
    documento.rect(x, y, largura, 42).fill(azulEscuro);
    documento.rect(x, y + 42, largura, 2).fill(ouro);

    this.desenharSeloUcm(documento, x + 12, y + 10, 24);

    documento
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(9.6)
      .text('Universidade Católica', x + 44, y + 9, {
        width: 132,
      })
      .font('Helvetica')
      .fontSize(7.2)
      .text('de Moçambique', x + 44, y + 22, {
        width: 110,
      });

    documento
      .fillColor('#D9E8F7')
      .font('Helvetica-Bold')
      .fontSize(8.4)
      .text('UCM', x + largura - 40, y + 16, {
        width: 30,
        lineBreak: false,
        align: 'center',
      });

    const fotoX = x + 13;
    const fotoY = y + 51;
    const fotoLargura = 61;
    const fotoAltura = 66;

    documento
      .roundedRect(fotoX, fotoY, fotoLargura, fotoAltura, 7)
      .fill('#EAF1F8')
      .strokeColor(ouro)
      .lineWidth(2)
      .stroke();

    const caminhoFoto = this.obterCaminhoFoto(
      cartao.estudante.foto,
    );

    if (caminhoFoto) {
      try {
        documento.save().rect(fotoX + 3, fotoY + 3, fotoLargura - 6, fotoAltura - 6).clip();
        documento.image(caminhoFoto, fotoX + 3, fotoY + 3, {
          cover: [fotoLargura - 6, fotoAltura - 6],
          align: 'center',
          valign: 'center',
        });
        documento.restore();
      } catch {
        this.desenharFotoVazia(
          documento,
          fotoX + 4,
          fotoY + 4,
          fotoLargura - 8,
          fotoAltura - 8,
        );
      }
    } else {
      this.desenharFotoVazia(
        documento,
        fotoX + 4,
        fotoY + 4,
        fotoLargura - 8,
        fotoAltura - 8,
      );
    }

    documento
      .fillColor('#64748B')
      .font('Helvetica-Bold')
      .fontSize(5.2)
      .text('FOTOGRAFIA OFICIAL', fotoX + 2, y + 117, {
        width: fotoLargura - 4,
        align: 'center',
        characterSpacing: 0.35,
      })
      .fillColor(ouro)
      .fontSize(6.2)
      .text('IDENTIFICAÇÃO ACADÉMICA', x + 85, y + 51, {
        width: 146,
        characterSpacing: 0.7,
      });

    documento
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(10.4)
      .text(cartao.estudante.nomeCompleto, x + 85, y + 63, {
        width: 141,
        height: 24,
        ellipsis: true,
      });

    documento
      .fillColor('#64748B')
      .fontSize(6.8)
      .text('CÓDIGO', x + 85, y + 89, { width: 76 })
      .text('FACULDADE', x + 166, y + 89, { width: 60 });

    documento
      .moveTo(x + 160, y + 89)
      .lineTo(x + 160, y + 107)
      .strokeColor('#D7E2EE')
      .lineWidth(0.7)
      .stroke();

    documento
      .fillColor(azul)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(cartao.estudante.codigo, x + 85, y + 98, { width: 72, height: 10, ellipsis: true })
      .text(cartao.estudante.curso.faculdade.sigla, x + 166, y + 98, { width: 60, height: 10, ellipsis: true });

    documento
      .fillColor('#64748B')
      .fontSize(6.8)
      .text('CURSO', x + 85, y + 111, { width: 30 });

    documento
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(6.5)
      .text(cartao.estudante.curso.nome, x + 115, y + 111, {
        width: 111,
        height: 10,
        ellipsis: true,
      });

    // Barra inferior azul
    documento.rect(x, y + altura - 29, largura, 29).fill(azul);

    documento
      .fillColor('#BFD7EE')
      .font('Helvetica-Bold')
      .fontSize(5.8)
      .text('NÚMERO DO CARTÃO', x + 13, y + altura - 23, {
        characterSpacing: 1,
        lineBreak: false,
      })
      .text('VALIDADE', x + largura - 58, y + altura - 23, {
        width: 42,
        align: 'right',
        characterSpacing: 1,
        lineBreak: false,
      });

    documento
      .fillColor('#FFFFFF')
      .fontSize(9.5)
      .text(cartao.numeroCartao, x + 13, y + altura - 14, {
        lineBreak: false,
        height: 12,
      })
      .text(
        this.formatarData(cartao.dataValidade),
        x + largura - 68,
        y + altura - 14,
        {
          width: 56,
          align: 'right',
          lineBreak: false,
          height: 12,
        },
      );
  }

  private desenharCartaoVerso(
    documento: any,
    cartao: CartaoComDados,
    bufferQrCode: Buffer,
    urlValidacao: string,
  ) {
    // Verso vai numa nova página (duplex)
    documento.addPage();

    const largura = documento.page.width;
    const altura = documento.page.height;
    const x = 0;
    const y = 0;
    const azul = '#003B71';
    const azulEscuro = '#00284D';
    const ouro = '#C9A227';

    // Fundo branco com moldura discreta para impressão CR80.
    documento.rect(x, y, largura, altura).fill('#FFFFFF');
    documento.rect(x + 1, y + 1, largura - 2, altura - 2)
      .strokeColor('#D7E2EE')
      .lineWidth(0.7)
      .stroke();

    documento.rect(x, y, largura, 40).fill(azulEscuro);
    documento.rect(x, y + 40, largura, 2).fill(ouro);

    this.desenharSeloUcm(documento, x + 12, y + 10, 24);

    documento
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text('Validação Digital', x + 44, y + 10, {
        width: 126,
      })
      .font('Helvetica')
      .fontSize(7)
      .text('UCM Cartões Académicos', x + 44, y + 24);

    documento
      .fillColor('#D9E8F7')
      .font('Helvetica-Bold')
      .fontSize(8.4)
      .text('UCM', x + largura - 40, y + 16, {
        width: 30,
        align: 'center',
      });

    documento
      .fillColor('#64748B')
      .font('Helvetica-Bold')
      .fontSize(6.5)
      .text('NÚMERO DO CARTÃO', x + 14, y + 64, {
        characterSpacing: 1,
      })
      .text('UNIDADE ACADÉMICA', x + 14, y + 87, {
        characterSpacing: 1,
      });

    documento
      .fillColor(azul)
      .fontSize(9)
      .text(cartao.numeroCartao, x + 14, y + 75, { width: 137 })
      .text(cartao.estudante.curso.faculdade.sigla, x + 14, y + 98, { width: 137 });

    documento
      .roundedRect(x + 14, y + 113, 132, 29, 5)
      .fill('#F1F5F9');

    documento
      .rect(x + 14, y + 113, 2, 27)
      .fill(ouro);

    documento
      .fillColor(azul)
      .font('Helvetica-Bold')
      .fontSize(6)
      .text('USO INSTITUCIONAL', x + 21, y + 118, { width: 118, characterSpacing: 0.4 })
      .fillColor('#334155')
      .font('Helvetica')
      .fontSize(5.4)
      .text(
        'Este cartão é pessoal e deve ser validado através do QR Code.',
        x + 21,
        y + 128,
        {
          width: 120,
          height: 12,
        },
      );

    documento
      .roundedRect(x + largura - 86, y + 57, 70, 70, 7)
      .fill('#FFFFFF')
      .strokeColor(ouro)
      .lineWidth(1)
      .stroke();

    documento.image(bufferQrCode, x + largura - 79, y + 64, {
      width: 56,
      height: 56,
    });

    documento
      .fillColor('#64748B')
      .font('Helvetica-Bold')
      .fontSize(5.2)
      .text('ESCANEAR PARA VALIDAR', x + largura - 88, y + 120, {
        width: 70,
        align: 'center',
        characterSpacing: 0.45,
      });

    // Selo legível de segurança: mantém-se visível mesmo em impressão CR80.
    documento
      .roundedRect(x + largura - 91, y + 132, 76, 14, 4)
      .fill('#EAF4FB');

    documento
      .circle(x + largura - 82, y + 139, 4)
      .fill(azul);

    documento
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(5.6)
      .text('✓', x + largura - 84.1, y + 135.6, { width: 5, align: 'center' });

    documento
      .fillColor(azul)
      .font('Helvetica-Bold')
      .fontSize(5.9)
      .text('SEGURO', x + largura - 75, y + 134.5, { width: 31 })
      .fontSize(5.3)
      .text('VERIFICÁVEL', x + largura - 75, y + 141, { width: 42 });

    documento
      .fillColor('#315B83')
      .font('Helvetica-Bold')
      .fontSize(6.6)
      .text('UCM', x + largura - 42, y + 137, {
        width: 20,
        align: 'center',
      });
  }

  private desenharSeloUcm(
    documento: any,
    x: number,
    y: number,
    tamanho: number,
  ) {
    const logo = join(process.cwd(), '..', 'frontend', 'src', 'assets', 'ucm-30-anos-logo.png');
    if (existsSync(logo)) {
      documento.circle(x + tamanho / 2, y + tamanho / 2, tamanho / 2).fill('#FFFFFF');
      documento.image(logo, x + 1, y + 1, { fit: [tamanho - 2, tamanho - 2], align: 'center', valign: 'center' });
      return;
    }
    documento
      .circle(x + tamanho / 2, y + tamanho / 2, tamanho / 2)
      .fill('#FFFFFF')
      .circle(x + tamanho / 2, y + tamanho / 2, tamanho / 2 - 2)
      .strokeColor('#003B71')
      .lineWidth(1)
      .stroke()
      .fillColor('#003B71')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('UCM', x, y + 8, {
        width: tamanho,
        align: 'center',
      });
  }

  private desenharFotoVazia(
    documento: any,
    x: number,
    y: number,
    largura: number,
    altura: number,
  ) {
    documento
      .rect(x, y, largura, altura)
      .fill('#E2E8F0')
      .fillColor('#64748B')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('FOTO', x, y + altura / 2 - 4, {
        width: largura,
        align: 'center',
      });
  }

  private obterCaminhoFoto(foto?: string | null) {
    if (!foto) {
      return null;
    }

    const caminhoRelativo = foto
      .replace(/^\/uploads\//, '')
      .replace(/^uploads\//, '');

    const caminho = join(
      process.cwd(),
      'uploads',
      'public',
      caminhoRelativo,
    );

    return existsSync(caminho) ? caminho : null;
  }

  private formatarData(data?: Date | string | null) {
    if (!data) {
      return 'Sem validade';
    }

    return new Date(data).toLocaleDateString('pt-PT');
  }

  async bloquear(id: number, motivo: string, usuarioId?: number) {
    const cartao = await this.prisma.cartaoAcademico.findUnique({
      where: { id },
    });

    if (!cartao) {
      throw new NotFoundException(
        'Cartão académico não encontrado.',
      );
    }

    if (cartao.estado !== 'ATIVO') {
      throw new BadRequestException(
        'Somente cartões ativos podem ser bloqueados.',
      );
    }

    if (!motivo?.trim()) {
      throw new BadRequestException(
        'Informe o motivo do bloqueio.',
      );
    }

    const cartaoAtualizado = await this.prisma.cartaoAcademico.update({
      where: { id },

      data: {
        estado: 'BLOQUEADO',
        bloqueadoEm: new Date(),
        motivoBloqueio: motivo.trim(),
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
      },
    });

    await this.auditoriaService.registrar({
      acao: 'BLOQUEAR_CARTAO',
      modulo: 'CARTOES',
      entidadeId: id,
      usuarioId,
      descricao: `Cartão ${cartaoAtualizado.numeroCartao} bloqueado. Motivo: ${motivo.trim()}.`,
    });

    return cartaoAtualizado;
  }

  async reemitir(id: number, motivo: string, usuarioId?: number) {
    const cartaoAntigo =
      await this.prisma.cartaoAcademico.findUnique({
        where: { id },

        include: {
          estudante: true,
        },
      });

    if (!cartaoAntigo) {
      throw new NotFoundException(
        'Cartão académico não encontrado.',
      );
    }

    if (
      cartaoAntigo.estado !== 'ATIVO' &&
      cartaoAntigo.estado !== 'BLOQUEADO'
    ) {
      throw new BadRequestException(
        'Este cartão não pode ser reemitido.',
      );
    }

    if (!motivo?.trim()) {
      throw new BadRequestException(
        'Informe o motivo da reemissão.',
      );
    }

    const numeroCartao = await this.gerarNumeroCartao();
    const qrToken = randomBytes(24).toString('hex');

    const resultado = await this.prisma.$transaction(async (prisma) => {
      await prisma.cartaoAcademico.update({
        where: {
          id: cartaoAntigo.id,
        },

        data: {
          estado: 'REEMITIDO',
          bloqueadoEm:
            cartaoAntigo.bloqueadoEm ?? new Date(),
          motivoBloqueio: motivo.trim(),
        },
      });

      const novoCartao =
        await prisma.cartaoAcademico.create({
          data: {
            numeroCartao,
            qrToken,
            estado: 'ATIVO',
            estudanteId: cartaoAntigo.estudanteId,
            dataValidade: cartaoAntigo.dataValidade,
            cartaoAnteriorId: cartaoAntigo.id,
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

      return {
        mensagem:
          'Cartão académico reemitido com sucesso.',

        cartaoAnterior: {
          id: cartaoAntigo.id,
          numeroCartao:
            cartaoAntigo.numeroCartao,
          estado: 'REEMITIDO',
        },

        novoCartao,
      };
    });

    await this.auditoriaService.registrar({
      acao: 'REEMITIR_CARTAO',
      modulo: 'CARTOES',
      entidadeId: resultado.novoCartao.id,
      usuarioId,
      descricao: `Cartão ${resultado.cartaoAnterior.numeroCartao} reemitido como ${resultado.novoCartao.numeroCartao}. Motivo: ${motivo.trim()}.`,
    });

    return resultado;
  }

  async meuCartao(usuarioId: number) {
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

    if (!usuario.estudante.ativo) {
      throw new BadRequestException(
        'Estudante inativo.',
      );
    }

    const cartao =
      await this.prisma.cartaoAcademico.findFirst({
        where: {
          estudanteId:
            usuario.estudante.id,

          estado: 'ATIVO',
        },

        orderBy: {
          dataEmissao: 'desc',
        },

        select: {
          id: true,
          numeroCartao: true,
          dataEmissao: true,
          dataValidade: true,
          estado: true,

          estudante: {
            select: {
              id: true,
              codigo: true,
              nomeCompleto: true,
              foto: true,

              curso: {
                select: {
                  id: true,
                  nome: true,
                  codigo: true,

                  faculdade: {
                    select: {
                      id: true,
                      nome: true,
                      sigla: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!cartao) {
      throw new NotFoundException(
        'O estudante não possui cartão académico ativo.',
      );
    }

    return cartao;
  }

  private async gerarNumeroCartao(): Promise<string> {
    while (true) {
      const ano = new Date().getFullYear();

      const numeroAleatorio = Math.floor(
        100000 + Math.random() * 900000,
      );

      const numeroCartao = `UCM-${ano}-${numeroAleatorio}`;

      const existente = await this.prisma.cartaoAcademico.findUnique({
        where: {
          numeroCartao,
        },
      });

      if (!existente) {
        return numeroCartao;
      }
    }
  }
}
