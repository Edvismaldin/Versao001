import { Test, TestingModule } from '@nestjs/testing';
import { PedidosReemissaoService } from './pedidos-reemissao.service.js';

describe('PedidosReemissaoService', () => {
  let service: PedidosReemissaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PedidosReemissaoService],
    }).compile();

    service = module.get<PedidosReemissaoService>(PedidosReemissaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
