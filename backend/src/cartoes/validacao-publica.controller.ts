import { Controller, Get, Param } from '@nestjs/common';
import { CartoesService } from './cartoes.service.js';

@Controller()
export class ValidacaoPublicaController {
  constructor(private readonly cartoesService: CartoesService) {}

  @Get('validar/:token')
  validar(@Param('token') token: string) {
    return this.cartoesService.validarCartao(token);
  }
}
