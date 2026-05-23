import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL is required in production. Add it to your Vercel environment variables.');
}

const pool = new Pool({
  connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/postgres',
});

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
