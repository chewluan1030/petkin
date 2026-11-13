import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL?.trim() || process.env.SQL_HOST?.trim()
  );
}

const TRANSIENT_POOL_ERROR_PATTERNS = [
  'Connection terminated unexpectedly',
  'terminating connection due to administrator command',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
];

function isTransientDisconnect(err: Error): boolean {
  const msg = err?.message || '';
  return TRANSIENT_POOL_ERROR_PATTERNS.some((pattern) => msg.includes(pattern));
}

function buildPoolConfig(): PoolConfig {
  const baseConfig: PoolConfig = {
    max: 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    allowExitOnIdle: true,
  };

  const connectionString = process.env.DATABASE_URL?.trim();
  if (connectionString) {
    return {
      ...baseConfig,
      connectionString,
    };
  }

  return {
    ...baseConfig,
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
  };
}

export const createPool = () => {
  if (!global._postgresPool) {
    const poolInstance = new Pool(buildPoolConfig());

    poolInstance.on('error', (err: Error) => {
      if (isTransientDisconnect(err)) {
        // Cloud SQL scale-to-zero or proxy closed an idle socket; pg.Pool evicts it automatically.
        return;
      }
      console.warn('SQL pool client reset:', err.message);
      if (global._postgresPool === poolInstance) {
        global._postgresPool = undefined;
      }
    });

    global._postgresPool = poolInstance;
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
