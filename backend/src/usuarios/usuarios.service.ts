import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import { CriarUsuarioDto } from './dto/criar-usuario.dto.js';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto.js';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  listar() {
    return this.prisma.usuario.findMany({
      orderBy: { id: 'desc' },
      select: { id: true, nome: true, email: true, perfil: true, ativo: true, foto: true },
    });
  }

  async criar(
    dadosOuNome: CriarUsuarioDto | string,
    emailPositional?: string,
    senhaPositional?: string,
    perfilPositional: any = 'ESTUDANTE',
    estudanteIdPositional?: number,
  ) {
    let nome: string;
    let email: string;
    let senha: string;
    let perfil: any;
    let estudanteId: number | undefined;

    if (typeof dadosOuNome === 'object') {
      nome = dadosOuNome.nome;
      email = dadosOuNome.email;
      senha = dadosOuNome.senha;
      perfil = dadosOuNome.perfil;
      estudanteId = undefined;
    } else {
      nome = dadosOuNome;
      email = emailPositional!;
      senha = senhaPositional!;
      perfil = perfilPositional;
      estudanteId = estudanteIdPositional;
    }

    const existente =
      await this.prisma.usuario.findUnique({
        where: {
          email,
        },
      });

    if (existente) {
      throw new BadRequestException(
        'Já existe um usuário com este email.',
      );
    }

    if (estudanteId) {
      const estudante =
        await this.prisma.estudante.findUnique({
          where: {
            id: estudanteId,
          },
        });

      if (!estudante) {
        throw new NotFoundException(
          'Estudante não encontrado.',
        );
      }

      const contaExistente =
        await this.prisma.usuario.findFirst({
          where: {
            estudanteId,
          },
        });

      if (contaExistente) {
        throw new BadRequestException(
          'Este estudante já possui uma conta.',
        );
      }
    }

    const senhaHash =
      await bcrypt.hash(
        senha,
        12,
      );

    const usuario =
      await this.prisma.usuario.create({
        data: {
          nome,
          email,
          senha: senhaHash,
          perfil: perfil as any,
          estudanteId:
            estudanteId ?? null,
        },
      });

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      estudanteId:
        usuario.estudanteId,
      ativo: usuario.ativo,
    };
  }

  async atualizar(id: number, dados: AtualizarUsuarioDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    if (dados.email && dados.email !== usuario.email) {
      const existente = await this.prisma.usuario.findUnique({
        where: { email: dados.email },
      });
      if (existente) {
        throw new BadRequestException('Já existe um utilizador com este email.');
      }
    }

    let senhaHash: string | undefined;
    if (dados.senha) {
      senhaHash = await bcrypt.hash(dados.senha, 12);
    }

    const usuarioAtualizado = await this.prisma.usuario.update({
      where: { id },
      data: {
        ...(dados.nome ? { nome: dados.nome } : {}),
        ...(dados.email ? { email: dados.email } : {}),
        ...(senhaHash ? { senha: senhaHash } : {}),
        ...(dados.perfil ? { perfil: dados.perfil as any } : {}),
        ...(dados.ativo !== undefined ? { ativo: dados.ativo } : {}),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        criadoEm: true,
      },
    });

    return usuarioAtualizado;
  }

  async remover(id: number, utilizadorAtualId: number) {
    if (id === utilizadorAtualId) {
      throw new BadRequestException('Não pode eliminar a sua própria conta.');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, perfil: true },
    });

    if (!usuario) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    if (usuario.perfil === 'ADMIN') {
      throw new BadRequestException('Contas de administração não podem ser eliminadas por este ecrã.');
    }

    await this.prisma.usuario.delete({ where: { id } });
    return { mensagem: 'Utilizador eliminado com sucesso.' };
  }

  buscarPorEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: {
        email,
      },
    });
  }

  async salvarFoto(id: number, nomeArquivo: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!usuario) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        foto: `/uploads/usuarios/${nomeArquivo}`,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        foto: true,
      },
    });
  }

  async buscarPorId(id: number) {
    const usuario =
      await this.prisma.usuario.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          nome: true,
          email: true,
          perfil: true,
          ativo: true,
          foto: true,
          criadoEm: true,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'Utilizador não encontrado',
      );
    }

    return usuario;
  }
}
