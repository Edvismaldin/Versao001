import { Module } from '@nestjs/common';
import { CursosController } from './cursos.controller.js';
import { CursosService } from './cursos.service.js';

@Module({
  controllers: [CursosController],
  providers: [CursosService],
})
export class CursosModule {}