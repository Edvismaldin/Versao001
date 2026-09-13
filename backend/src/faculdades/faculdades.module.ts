import { Module } from '@nestjs/common';
import { FaculdadesService } from './faculdades.service.js';
import { FaculdadesController } from './faculdades.controller.js';

@Module({
  controllers: [FaculdadesController],
  providers: [FaculdadesService],
})
export class FaculdadesModule {}