import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AutenticacaoController } from './autenticacao.controller.js';
import { AutenticacaoService } from './autenticacao.service.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';

@Module({
  imports: [
    UsuariosModule,

    JwtModule.register({
      secret:
        process.env.JWT_SECRET ??
        'ucm-card-chave-temporaria',

      signOptions: {
        expiresIn: '8h',
      },
    }),
  ],

  controllers: [
    AutenticacaoController,
  ],

  providers: [
    AutenticacaoService,
  ],

  exports: [
    AutenticacaoService,
    JwtModule,
  ],
})
export class AutenticacaoModule {}