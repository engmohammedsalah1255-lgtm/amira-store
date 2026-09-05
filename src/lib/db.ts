import { getCloudflareContext } from '@opennextjs/cloudflare';
import { PrismaNeonHTTP } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getDatabaseUrl() {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

	try {
		const { env } = getCloudflareContext();
		return (env as Record<string, string | undefined>).DATABASE_URL ?? '';
	} catch {
		return '';
	}
}

const databaseUrl = getDatabaseUrl();
const isPostgres = /^(postgres|postgresql):\/\//i.test(databaseUrl);

const prisma = isPostgres
	? new PrismaClient({ adapter: new PrismaNeonHTTP(databaseUrl, {}) })
	: new PrismaClient();

export const db = globalForPrisma.prisma ?? prisma;
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
