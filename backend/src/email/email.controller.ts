import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';

import { EmailService } from './email.service.js';
import { JwtAuthGuard } from '../autenticacao/guards/jwt-auth.guard.js';
import { PerfisGuard } from '../autenticacao/guards/perfis.guard.js';
import { Perfis } from '../autenticacao/decorators/perfis.decorator.js';

@Controller('email')
@UseGuards(JwtAuthGuard, PerfisGuard)
@Perfis('ADMIN')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
  ) {}

  @Post('teste')
  async testar(
    @Body()
    dados: {
      destinatario: string;
    },
  ) {
    await this.emailService.enviarEmail(
      dados.destinatario,
      'Teste SMTP - UCM Cartões',
      `
Olá,

Este é um email de teste do Sistema de Gestão e Geração de Cartões Académicos da UCM.

Se recebeu esta mensagem, a configuração SMTP está funcionando corretamente.

Universidade Católica de Moçambique
      `.trim(),
    );

    return {
      mensagem:
        'Email de teste enviado com sucesso.',
    };
  }
}