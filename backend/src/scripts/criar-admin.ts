import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient, PerfilUsuario } from '../generated/prisma/client.js';
import { criarAdaptadorMariaDb } from '../prisma/mariadb.adapter.js';

const prisma = new PrismaClient({ adapter: criarAdaptadorMariaDb() });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const senhaInicial = process.env.ADMIN_INITIAL_PASSWORD;

  if (!email) {
    throw new Error('ADMIN_EMAIL não definida.');
  }

  if (!senhaInicial) {
    throw new Error('ADMIN_INITIAL_PASSWORD não definida.');
  }

  const senhaHash = await bcrypt.hash(senhaInicial, 12);

  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: {
      nome: 'Administrador UCM',
      senha: senhaHash,
      perfil: PerfilUsuario.ADMIN,
      ativo: true,
    },
    create: {
      nome: 'Administrador UCM',
      email,
      senha: senhaHash,
      perfil: PerfilUsuario.ADMIN,
      ativo: true,
    },
  });

  console.log('Administrador criado/atualizado com sucesso.');
  console.log('ID:', usuario.id);
  console.log('Email:', usuario.email);
  console.log('Perfil:', usuario.perfil);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
