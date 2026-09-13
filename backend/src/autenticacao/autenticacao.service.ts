import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsuariosService } from '../usuarios/usuarios.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class AutenticacaoService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async login(email: string, senha: string) {
    const usuario =
      await this.usuariosService.buscarPorEmail(email);

    if (!usuario) {
      throw new UnauthorizedException(
        'Email ou senha inválidos',
      );
    }

    if (!usuario.ativo) {
      throw new UnauthorizedException(
        'Utilizador inativo',
      );
    }

    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senha,
    );

    if (!senhaCorreta) {
      throw new UnauthorizedException(
        'Email ou senha inválidos',
      );
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      accessToken,

      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        foto: usuario.foto,
      },
    };
  }

  async me(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        id: usuarioId,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        estudanteId: true,
        foto: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException(
        'Usuário não encontrado.',
      );
    }

    if (!usuario.ativo) {
      throw new UnauthorizedException(
        'Usuário desativado.',
      );
    }

    return {
      autenticado: true,
      usuario,
    };
  }

  async solicitarAtivacaoEstudante(
    codigo: string,
    email: string,
  ) {
    const codigoLimpo = codigo?.trim();
    const emailLimpo = email?.trim().toLowerCase();

    if (!codigoLimpo || !emailLimpo) {
      throw new BadRequestException('Informe o código e o email.');
    }

    const estudante = await this.prisma.estudante.findFirst({
      where: {
        codigo: codigoLimpo,
        email: emailLimpo,
        ativo: true,
      },
    });

    if (!estudante) {
      throw new BadRequestException('Não foi possível validar os dados informados.');
    }

    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: {
        estudanteId: estudante.id,
      },
    });

    if (usuarioExistente) {
      throw new BadRequestException('Este estudante já possui uma conta.');
    }

    const ativacaoRecente = await this.prisma.ativacaoEstudante.findFirst({
      where: {
        estudanteId: estudante.id,
        estado: 'PENDENTE',
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    if (ativacaoRecente) {
      const agora = Date.now();
      const criadoEm = ativacaoRecente.criadoEm.getTime();
      const segundosPassados = Math.floor((agora - criadoEm) / 1000);

      if (segundosPassados < 60) {
        const segundosRestantes = 60 - segundosPassados;

        throw new BadRequestException(
          `Aguarde ${segundosRestantes} segundos antes de solicitar outro código.`,
        );
      }
    }

    await this.prisma.ativacaoEstudante.updateMany({
      where: {
        estudanteId: estudante.id,
        estado: 'PENDENTE',
      },
      data: {
        estado: 'EXPIRADO',
      },
    });

    const codigoAtivacao = randomInt(100000, 1000000).toString();
    const tokenHash = await bcrypt.hash(codigoAtivacao, 12);
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000);

    const ativacao = await this.prisma.ativacaoEstudante.create({
      data: {
        tokenHash,
        estudanteId: estudante.id,
        estado: 'PENDENTE',
        expiraEm,
        tentativas: 0,
      },
    });

    if (estudante.email) {
      try {
        await this.emailService.enviarEmail(
          estudante.email,
          'Código de ativação - UCM Cartões',
          `
Olá ${estudante.nomeCompleto},

O seu código de ativação é:

${codigoAtivacao}

Este código é válido por 10 minutos.

Se não solicitou esta ativação, ignore esta mensagem.

UCM Cartões
          `.trim(),
        );
      } catch (erro) {
        console.error('FALHA SMTP NO SOLICITAR ATIVACAO:', erro);
        await this.prisma.ativacaoEstudante.update({
          where: {
            id: ativacao.id,
          },
          data: {
            estado: 'EXPIRADO',
          },
        });

        throw new InternalServerErrorException(
          'Não foi possível enviar o código de ativação.',
        );
      }
    }

    const partesEmail = estudante.email!.split('@');
    const inicio = partesEmail[0].substring(0, 3);
    const emailMascarado = `${inicio}***@${partesEmail[1]}`;

    return {
      mensagem: 'Código de ativação enviado para o seu e-mail institucional.',
      emailMascarado,
    };
  }

  async confirmarCodigoAtivacaoEstudante(dados: {
    codigoEstudante: string;
    codigoAtivacao: string;
  }) {
    if (!dados.codigoEstudante?.trim() || !dados.codigoAtivacao?.trim()) {
      throw new BadRequestException('Informe o código do estudante e o código de ativação.');
    }

    const estudante = await this.prisma.estudante.findFirst({
      where: {
        codigo: dados.codigoEstudante.trim(),
        ativo: true,
      },
    });

    if (!estudante) {
      throw new BadRequestException('Estudante não encontrado.');
    }

    const ativacao = await this.prisma.ativacaoEstudante.findFirst({
      where: {
        estudanteId: estudante.id,
        estado: 'PENDENTE',
        utilizadoEm: null,
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    if (!ativacao) {
      throw new BadRequestException('Código de ativação inválido ou expirado.');
    }

    if (ativacao.tentativas >= 5) {
      await this.prisma.ativacaoEstudante.update({
        where: {
          id: ativacao.id,
        },
        data: {
          estado: 'EXPIRADO',
        },
      });

      throw new BadRequestException(
        'Número máximo de tentativas excedido. Solicite um novo código.',
      );
    }

    if (ativacao.expiraEm.getTime() < Date.now()) {
      await this.prisma.ativacaoEstudante.update({
        where: {
          id: ativacao.id,
        },
        data: {
          estado: 'EXPIRADO',
        },
      });

      throw new BadRequestException(
        'O código de ativação expirou. Solicite um novo código.',
      );
    }

    const codigoValido = await bcrypt.compare(
      dados.codigoAtivacao.trim(),
      ativacao.tokenHash,
    );

    if (!codigoValido) {
      const novasTentativas = ativacao.tentativas + 1;

      await this.prisma.ativacaoEstudante.update({
        where: {
          id: ativacao.id,
        },
        data: {
          tentativas: {
            increment: 1,
          },
          ...(novasTentativas >= 5
            ? {
                estado: 'EXPIRADO',
              }
            : {}),
        },
      });

      if (novasTentativas >= 5) {
        throw new BadRequestException(
          'Número máximo de tentativas excedido. Solicite um novo código.',
        );
      }

      throw new BadRequestException(
        `Código inválido. Restam ${
          5 - novasTentativas
        } tentativa(s).`,
      );
    }

    return {
      valido: true,
      mensagem: 'Código de ativação confirmado.',
    };
  }

  async concluirAtivacaoEstudante(dados: {
    codigoEstudante: string;
    codigoAtivacao: string;
    senha: string;
    confirmarSenha: string;
  }) {
    const codigoEstudante = dados.codigoEstudante?.trim();
    const codigoAtivacao = dados.codigoAtivacao?.trim();
    const senha = dados.senha;
    const confirmarSenha = dados.confirmarSenha;

    if (
      !codigoEstudante ||
      !codigoAtivacao ||
      !senha ||
      !confirmarSenha
    ) {
      throw new BadRequestException('Preencha todos os campos obrigatórios.');
    }

    if (senha !== confirmarSenha) {
      throw new BadRequestException('As senhas não coincidem.');
    }

    if (senha.length < 6) {
      throw new BadRequestException('A senha deve ter pelo menos 6 caracteres.');
    }

    const estudante = await this.prisma.estudante.findUnique({
      where: {
        codigo: codigoEstudante,
      },
    });

    if (!estudante || !estudante.ativo || !estudante.email) {
      throw new BadRequestException('Estudante inválido.');
    }

    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: {
        estudanteId: estudante.id,
      },
    });

    if (usuarioExistente) {
      throw new BadRequestException('Este estudante já possui uma conta ativa.');
    }

    const ativacao = await this.prisma.ativacaoEstudante.findFirst({
      where: {
        estudanteId: estudante.id,
        estado: 'PENDENTE',
        utilizadoEm: null,
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    if (!ativacao) {
      throw new BadRequestException('Código de ativação inválido ou expirado.');
    }

    if (ativacao.tentativas >= 5) {
      await this.prisma.ativacaoEstudante.update({
        where: {
          id: ativacao.id,
        },
        data: {
          estado: 'EXPIRADO',
        },
      });

      throw new BadRequestException(
        'Número máximo de tentativas excedido. Solicite um novo código.',
      );
    }

    if (ativacao.expiraEm.getTime() < Date.now()) {
      await this.prisma.ativacaoEstudante.update({
        where: {
          id: ativacao.id,
        },
        data: {
          estado: 'EXPIRADO',
        },
      });

      throw new BadRequestException(
        'O código de ativação expirou. Solicite um novo código.',
      );
    }

    const codigoValido = await bcrypt.compare(
      codigoAtivacao,
      ativacao.tokenHash,
    );

    if (!codigoValido) {
      const novasTentativas = ativacao.tentativas + 1;

      await this.prisma.ativacaoEstudante.update({
        where: {
          id: ativacao.id,
        },
        data: {
          tentativas: {
            increment: 1,
          },
          ...(novasTentativas >= 5
            ? {
                estado: 'EXPIRADO',
              }
            : {}),
        },
      });

      if (novasTentativas >= 5) {
        throw new BadRequestException(
          'Número máximo de tentativas excedido. Solicite um novo código.',
        );
      }

      throw new BadRequestException(
        `Código inválido. Restam ${
          5 - novasTentativas
        } tentativa(s).`,
      );
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const usuarioCriado = await this.prisma.$transaction(async (tx) => {
      await tx.ativacaoEstudante.update({
        where: {
          id: ativacao.id,
        },
        data: {
          estado: 'UTILIZADO',
          utilizadoEm: new Date(),
        },
      });

      return tx.usuario.create({
        data: {
          nome: estudante.nomeCompleto,
          email: estudante.email!,
          senha: senhaHash,
          perfil: 'ESTUDANTE',
          ativo: true,
          estudanteId: estudante.id,
        },
      });
    });

    return {
      mensagem: 'Conta ativada com sucesso! Você já pode realizar o login.',
      usuario: {
        id: usuarioCriado.id,
        nome: usuarioCriado.nome,
        email: usuarioCriado.email,
        perfil: usuarioCriado.perfil,
      },
    };
  }
}
