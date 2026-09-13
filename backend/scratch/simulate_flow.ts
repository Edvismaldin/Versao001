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

async function printDBState(etapa: string) {
  console.log(`\n========================================`);
  console.log(`ETAPA: ${etapa}`);
  console.log(`========================================`);

  console.log('--- PEDIDOS REEMISSÃO ---');
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
  console.table(pedidos);

  console.log('\n--- CARTÕES ACADÉMICOS (ESTUDANTE 3) ---');
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
  console.table(cartoes);
}

async function main() {
  await prisma.$connect();

  // 1. Garantir que o Estudante 3 possui cartão inicial ATIVO
  let cartaoInicial = await prisma.cartaoAcademico.findFirst({
    where: { estudanteId: 3, estado: 'ATIVO' },
  });

  if (!cartaoInicial) {
    const totalCartoes = await prisma.cartaoAcademico.count();
    cartaoInicial = await prisma.cartaoAcademico.create({
      data: {
        numeroCartao: `2026-7012202026-${String(totalCartoes + 1).padStart(2, '0')}`,
        qrToken: `QR-7012202026-${Date.now()}`,
        estado: 'ATIVO',
        estudanteId: 3,
        dataValidade: new Date('2028-12-31'),
      },
    });
    console.log('Cartão inicial criado para Estudante 3:', cartaoInicial.numeroCartao);
  }

  await printDBState('0. ESTADO INICIAL (Com cartão ativo)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
