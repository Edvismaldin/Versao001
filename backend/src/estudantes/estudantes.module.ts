import { Module } from '@nestjs/common';
import { EstudantesController } from './estudantes.controller.js';
import { EstudantesService } from './estudantes.service.js';

@Module({
  controllers: [EstudantesController],
  providers: [EstudantesService],
})
export class EstudantesModule {}