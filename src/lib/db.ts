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

function createPrismaClient() {
	const databaseUrl = getDatabaseUrl();
	const isPostgres = /^(postgres|postgresql):\/\//i.test(databaseUrl);

	if (isPostgres) {
		return new PrismaClient({ adapter: new PrismaNeonHTTP(databaseUrl, {}) });
	}

	if (process.env.NODE_ENV === 'production') {
		throw new Error('DATABASE_URL is not available in the Cloudflare request context.');
	}

	return new PrismaClient();
}

function getPrismaClient() {
	if (!globalForPrisma.prisma) {
		globalForPrisma.prisma = createPrismaClient();
	}

	return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
	get(_target, property) {
		const value = getPrismaClient()[property as keyof PrismaClient];
		return typeof value === 'function' ? value.bind(getPrismaClient()) : value;
	},
});
