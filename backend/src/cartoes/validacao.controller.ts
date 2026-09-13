import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { CartoesService } from './cartoes.service.js';

@Controller('validar')
export class ValidacaoController {
  constructor(
    private readonly cartoesService: CartoesService,
  ) {}

  @Get(':token')
  validar(@Param('token') token: string) {
    return this.cartoesService.validarCartao(token);
  }
}
