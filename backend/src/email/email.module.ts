import { Global, Module } from '@nestjs/common';

import { EmailService } from './email.service.js';
import { EmailController } from './email.controller.js';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module.js';

@Global()
@Module({
  imports: [
    AutenticacaoModule,
  ],
  controllers: [
    EmailController,
  ],
  providers: [
    EmailService,
  ],
  exports: [
    EmailService,
  ],
})
export class EmailModule {}