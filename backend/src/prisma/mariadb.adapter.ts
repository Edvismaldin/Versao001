import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function numeroAmbiente(nome: string, padrao: number) {
  const valor = Number(process.env[nome]);
  return Number.isFinite(valor) && valor > 0 ? valor : padrao;
}

function obterUrlBase() {
  const valor = process.env.DATABASE_URL;
  if (!valor) return undefined;

  try {
    return new URL(valor);
  } catch {
    return undefined;
  }
}

/**
 * Uma única configuração de ligação para a API Nest e para scripts locais.
 * DB_HOST/DB_PORT/etc. têm prioridade; DATABASE_URL serve como alternativa.
 */
export function criarAdaptadorMariaDb() {
  const url = obterUrlBase();
  const sslDaUrl = ['required', 'verify-ca', 'verify-full'].includes(
    url?.searchParams.get('ssl-mode')?.toLowerCase() ?? '',
  );
  const usarSsl = process.env.DB_SSL === 'true' || sslDaUrl;

  return new PrismaMariaDb({
    host: process.env.DB_HOST ?? url?.hostname ?? 'localhost',
    port: numeroAmbiente('DB_PORT', Number(url?.port) || 3306),
    user:
      process.env.DB_USER ??
      (url?.username ? decodeURIComponent(url.username) : 'root'),
    password:
      process.env.DB_PASSWORD ??
      (url?.password ? decodeURIComponent(url.password) : ''),
    database:
      process.env.DB_NAME ??
      (url?.pathname ? decodeURIComponent(url.pathname.slice(1)) : 'ucm_cartoes'),
    connectTimeout: numeroAmbiente('DB_CONNECT_TIMEOUT_MS', 15_000),
    acquireTimeout: numeroAmbiente('DB_ACQUIRE_TIMEOUT_MS', 20_000),
    initializationTimeout: numeroAmbiente('DB_INITIALIZATION_TIMEOUT_MS', 15_000),
    socketTimeout: numeroAmbiente('DB_SOCKET_TIMEOUT_MS', 60_000),
    connectionLimit: numeroAmbiente('DB_CONNECTION_LIMIT', 3),
    ...(usarSsl
      ? {
          ssl: {
            rejectUnauthorized:
              process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
          },
        }
      : {}),
  });
}
