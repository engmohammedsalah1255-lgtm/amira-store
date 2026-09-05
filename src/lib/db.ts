import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
const databaseUrl = process.env.DATABASE_URL ?? '';
const isPostgres = /^(postgres|postgresql):\/\//i.test(databaseUrl);

const prisma = isPostgres
	? new PrismaClient({ adapter: new PrismaNeon({ connectionString: databaseUrl }) })
	: new PrismaClient();

export const db = globalForPrisma.prisma ?? prisma;
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
