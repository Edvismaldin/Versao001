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

async function main() {
  await prisma.$connect();

  console.log('=== TODOS OS ESTUDANTES ===');
  const estudantes: any[] = await prisma.$queryRawUnsafe(`SELECT id, codigo, nomeCompleto FROM estudantes`);
  console.table(estudantes);

  console.log('\n=== TODOS OS CARTÕES ===');
  const cartoes: any[] = await prisma.$queryRawUnsafe(`SELECT id, numeroCartao, estado, estudanteId, cartaoAnteriorId FROM cartoes_academicos`);
  console.table(cartoes);

  console.log('\n=== TODOS OS PEDIDOS DE REEMISSÃO ===');
  const pedidos: any[] = await prisma.$queryRawUnsafe(`SELECT id, estudanteId, cartaoId, estado, observacao, responsavelId, analisadoEm, localLevantamento, prontoEm, entregueEm FROM pedidos_reemissao`);
  console.table(pedidos);

  console.log('\n=== USUÁRIOS ===');
  const usuarios: any[] = await prisma.$queryRawUnsafe(`SELECT id, nome, email, perfil, estudanteId FROM usuarios`);
  console.table(usuarios);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
