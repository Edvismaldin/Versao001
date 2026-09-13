import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AutenticacaoService } from './autenticacao.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SolicitarAtivacaoDto } from './dto/solicitar-ativacao.dto.js';
import { ConcluirAtivacaoDto } from './dto/concluir-ativacao.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Controller('autenticacao')
export class AutenticacaoController {
  constructor(
    private readonly autenticacaoService: AutenticacaoService,
  ) {}

  @Post('login')
  login(
    @Body() dados: LoginDto,
  ) {
    return this.autenticacaoService.login(
      dados.email,
      dados.senha,
    );
  }

  @Post('estudante/solicitar-ativacao')
  solicitarAtivacao(
    @Body() dados: SolicitarAtivacaoDto,
  ) {
    return this.autenticacaoService.solicitarAtivacaoEstudante(
      dados.codigo,
      dados.email,
    );
  }

  @Post('estudante/confirmar-codigo')
  confirmarCodigoAtivacaoEstudante(
    @Body()
    dados: {
      codigoEstudante: string;
      codigoAtivacao: string;
    },
  ) {
    return this.autenticacaoService.confirmarCodigoAtivacaoEstudante(dados);
  }

  @Post('estudante/concluir-ativacao')
  concluirAtivacao(
    @Body() dados: ConcluirAtivacaoDto,
  ) {
    return this.autenticacaoService.concluirAtivacaoEstudante(dados);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() request: any) {
    return this.autenticacaoService.me(
      request.usuario.sub,
    );
  }
}
