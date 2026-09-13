import { Test, TestingModule } from '@nestjs/testing';
import { PedidosReemissaoController } from './pedidos-reemissao.controller.js';

describe('PedidosReemissaoController', () => {
  let controller: PedidosReemissaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PedidosReemissaoController],
    }).compile();

    controller = module.get<PedidosReemissaoController>(PedidosReemissaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
