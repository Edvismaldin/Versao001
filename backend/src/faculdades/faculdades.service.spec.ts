import { Test, TestingModule } from '@nestjs/testing';
import { FaculdadesService } from './faculdades.service.js';

describe('FaculdadesService', () => {
  let service: FaculdadesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FaculdadesService],
    }).compile();

    service = module.get<FaculdadesService>(FaculdadesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
