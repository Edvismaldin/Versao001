import { Module, forwardRef } from '@nestjs/common';

import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module.js';

@Module({
  imports: [
    forwardRef(() => AutenticacaoModule),
  ],

  controllers: [
    UsuariosController,
  ],

  providers: [
    UsuariosService,
  ],

  exports: [
    UsuariosService,
  ],
})
export class UsuariosModule {}