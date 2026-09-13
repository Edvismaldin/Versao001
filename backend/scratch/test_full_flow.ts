import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'ucm_cartoes',
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function queryPedidos() {
  const pedidos: any[] = await prisma.$queryRawUnsafe(`
    SELECT
      id,
      estado,
      observacao,
      responsavelId,
      analisadoEm,
      localLevantamento,
      prontoEm,
      entregueEm
    FROM pedidos_reemissao
    ORDER BY id DESC
  `);
  console.log('\n--- SELECT FROM pedidos_reemissao ---');
  console.table(pedidos);
}

async function queryCartoes() {
  const cartoes: any[] = await prisma.$queryRawUnsafe(`
    SELECT
      id,
      numeroCartao,
      estado,
      estudanteId,
      cartaoAnteriorId,
      dataEmissao
    FROM cartoes_academicos
    WHERE estudanteId = 3
    ORDER BY criadoEm
  `);
  console.log('\n--- SELECT FROM cartoes_academicos (estudanteId = 3) ---');
  console.table(cartoes);
}

async function main() {
  await prisma.$connect();

  console.log('==================================================');
  console.log('PASSO 1: ESTUDANTE Solicita Reemissão (PENDENTE)');
  console.log('==================================================');

  // Buscar cartão ativo do estudante
  const cartaoAtual = await prisma.cartaoAcademico.findFirstOrThrow({
    where: { estudanteId: 3, estado: 'ATIVO' },
  });

  const pedido = await prisma.pedidoReemissao.create({
    data: {
      estudanteId: 3,
      cartaoId: cartaoAtual.id,
      motivo: 'Perda do cartão original no campus',
      estado: 'PENDENTE',
    },
  });

  console.log(`\nPedido #${pedido.id} criado com sucesso! Estado: ${pedido.estado}`);
  await queryPedidos();
  await queryCartoes();

  console.log('\n==================================================');
  console.log('PASSO 2: RESPONSÁVEL Inicia Análise (EM_ANALISE)');
  console.log('==================================================');

  const pedidoEmAnalise = await prisma.pedidoReemissao.update({
    where: { id: pedido.id },
    data: {
      estado: 'EM_ANALISE',
      responsavelId: 5, // ID do usuario Responsavel 'Jose'
      analisadoEm: new Date(),
    },
  });

  console.log(`\nPedido #${pedidoEmAnalise.id} colocado em análise por Responsável 5. Estado: ${pedidoEmAnalise.estado}`);
  await queryPedidos();
  await queryCartoes();

  console.log('\n==================================================');
  console.log('PASSO 3: RESPONSÁVEL Aprova Pedido (EM_PRODUCAO)');
  console.log('==================================================');

  // Ao aprovar:
  // 1. O cartão anterior passa a 'REEMITIDO'
  // 2. É gerado um novo cartão 'ATIVO' com cartaoAnteriorId = id do cartão antigo
  // 3. O pedido passa a 'EM_PRODUCAO'

  await prisma.cartaoAcademico.update({
    where: { id: cartaoAtual.id },
    data: { estado: 'REEMITIDO' },
  });

  const totalCartoes = await prisma.cartaoAcademico.count();
  const novoCartao = await prisma.cartaoAcademico.create({
    data: {
      numeroCartao: `2026-7012202026-${String(totalCartoes + 1).padStart(2, '0')}`,
      qrToken: `QR-7012202026-${Date.now()}`,
      estado: 'ATIVO',
      estudanteId: 3,
      cartaoAnteriorId: cartaoAtual.id,
      dataValidade: new Date('2028-12-31'),
    },
  });

  const pedidoAprovado = await prisma.pedidoReemissao.update({
    where: { id: pedido.id },
    data: {
      estado: 'EM_PRODUCAO',
      observacao: 'Pedido aprovado. Cartão enviado para produção.',
      responsavelId: 5,
    },
  });

  console.log(`\nPedido #${pedidoAprovado.id} aprovado. Novo Cartão #${novoCartao.id} (${novoCartao.numeroCartao}) emitido.`);
  await queryPedidos();
  await queryCartoes();

  console.log('\n==================================================');
  console.log('PASSO 4: RESPONSÁVEL Marca como Pronto (PRONTO_LEVANTAMENTO)');
  console.log('==================================================');

  const pedidoPronto = await prisma.pedidoReemissao.update({
    where: { id: pedido.id },
    data: {
      estado: 'PRONTO_LEVANTAMENTO',
      localLevantamento: 'Secretaria Geral da UCM',
      prontoEm: new Date(),
      responsavelId: 5,
    },
  });

  console.log(`\nPedido #${pedidoPronto.id} pronto para levantamento em '${pedidoPronto.localLevantamento}'.`);
  await queryPedidos();
  await queryCartoes();

  console.log('\n==================================================');
  console.log('PASSO 5: RESPONSÁVEL Confirma Entrega (ENTREGUE)');
  console.log('==================================================');

  const agora = new Date();
  const pedidoEntregue = await prisma.pedidoReemissao.update({
    where: { id: pedido.id },
    data: {
      estado: 'ENTREGUE',
      entregueEm: agora,
      concluidoEm: agora,
      responsavelId: 5,
    },
  });

  console.log(`\nPedido #${pedidoEntregue.id} entregue com sucesso.`);
  await queryPedidos();
  await queryCartoes();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
