import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

function numeroAmbiente(nome: string, padrao: number) {
  const valor = Number(process.env[nome]);
  return Number.isFinite(valor) && valor > 0 ? valor : padrao;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const usarSsl = process.env.DB_SSL === 'true';

    const adapter = new PrismaMariaDb({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'ucm_cartoes',
      // Serviços remotos como Render -> Aiven normalmente precisam de mais de
      // 1 segundo para estabelecer o socket. O padrão do driver é 1000 ms.
      connectTimeout: numeroAmbiente('DB_CONNECT_TIMEOUT_MS', 15_000),
      acquireTimeout: numeroAmbiente('DB_ACQUIRE_TIMEOUT_MS', 20_000),
      initializationTimeout: numeroAmbiente('DB_INITIALIZATION_TIMEOUT_MS', 15_000),
      socketTimeout: numeroAmbiente('DB_SOCKET_TIMEOUT_MS', 60_000),
      // Mantém cada instância do Render dentro de um limite seguro do Aiven.
      connectionLimit: numeroAmbiente('DB_CONNECTION_LIMIT', 3),
      ...(usarSsl
        ? {
            ssl: {
              // Aiven utiliza TLS. Em produção, use DB_SSL_REJECT_UNAUTHORIZED=true
              // quando o certificado CA do Aiven estiver configurado no ambiente.
              rejectUnauthorized:
                process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
            },
          }
        : {}),
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
