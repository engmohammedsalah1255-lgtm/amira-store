import { env as workerEnv } from 'cloudflare:workers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { PrismaNeonHTTP } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

interface PrismaState {
  requestClients: WeakMap<object, PrismaClient>;
  localClient?: PrismaClient;
}

const globalForPrisma = globalThis as typeof globalThis & {
  __amiraPrismaState?: PrismaState;
};

const state: PrismaState = (globalForPrisma.__amiraPrismaState ??= {
  requestClients: new WeakMap<object, PrismaClient>(),
});

function isPostgresUrl(value: string): boolean {
  return /^(postgres|postgresql):\/\//i.test(value.trim());
}

function createNeonClient(databaseUrl: string): PrismaClient {
  if (!isPostgresUrl(databaseUrl)) {
    throw new Error('DATABASE_URL must be a PostgreSQL/Neon connection string in Cloudflare runtime.');
  }

  return new PrismaClient({
    adapter: new PrismaNeonHTTP(databaseUrl.trim(), {}),
  });
}

function getCloudflareDatabaseContext(): { databaseUrl: string; requestKey: object } | null {
  try {
    const context = getCloudflareContext();
    const databaseUrl =
      typeof workerEnv.DATABASE_URL === 'string'
        ? workerEnv.DATABASE_URL.trim()
        : typeof process.env.DATABASE_URL === 'string'
          ? process.env.DATABASE_URL.trim()
          : '';

    if (databaseUrl && isPostgresUrl(databaseUrl)) {
      return { databaseUrl, requestKey: context.ctx };
    }

    return null;
  } catch {
    return null;
  }
}

function getPrismaClient(): PrismaClient {
  const cloudflare = getCloudflareDatabaseContext();
  if (cloudflare) {
    const cached = state.requestClients.get(cloudflare.requestKey);
    if (cached) return cached;

    const client = createNeonClient(cloudflare.databaseUrl);
    state.requestClients.set(cloudflare.requestKey, client);
    return client;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim() ?? '';

  // Keep local Node.js development compatible with both SQLite and PostgreSQL.
  if (databaseUrl && isPostgresUrl(databaseUrl)) {
    state.localClient ??= createNeonClient(databaseUrl);
    return state.localClient;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL is missing from the Cloudflare Worker runtime. Configure it as a Worker secret named DATABASE_URL.',
    );
  }

  state.localClient ??= new PrismaClient();
  return state.localClient;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, property: PropertyKey) {
    const client = getPrismaClient();
    const value = Reflect.get(client as object, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
