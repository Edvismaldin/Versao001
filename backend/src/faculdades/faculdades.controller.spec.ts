import { Test, TestingModule } from '@nestjs/testing';
import { FaculdadesController } from './faculdades.controller.js';

describe('FaculdadesController', () => {
  let controller: FaculdadesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaculdadesController],
    }).compile();

    controller = module.get<FaculdadesController>(FaculdadesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
