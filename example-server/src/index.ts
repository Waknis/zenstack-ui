// import { Pool } from '@prisma/pg-worker'; // Normal postgres, like Supabase
// import { PrismaPg } from '@prisma/adapter-pg-worker'; // Normal postgres, like Supabase
import { trpcServer } from '@hono/trpc-server';
import { neonConfig, Pool } from '@neondatabase/serverless'; // Neon
import { PrismaNeon } from '@prisma/adapter-neon'; // Neon
import { PrismaClient } from '@prisma/client';
import { createHonoHandler } from '@zenstackhq/server/hono';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import ws from 'ws';

import { router } from '~server/api';
import type { TrpcContext } from '~server/trpc';
import { enhance } from '~zenstack/enhance-edge';

interface Bindings {
	DATABASE_URL: string // your postgres database URL
	WEBSITE_URL: string // your client website URL (ex: hosted on cloudflare pages)
}

const app = new Hono<{ Bindings: Bindings }>();

// Cors middleware
app.use('*', async (c, next) => {
	return cors({
		origin: c.env.WEBSITE_URL,
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization', 'x-trpc-source'],
	})(c, next);
});

// Create prisma edge context for trpc and zenstack adapters
const createPrismaContext = (ctx: { env: Bindings }) => {
	// Normal postgres, like Supabase
	// const connectionString = ctx.env.DATABASE_URL;
	// const pool = new Pool({ connectionString });
	// const adapter = new PrismaPg(pool);
	// const prisma = new PrismaClient({ adapter });

	// Neon adapter
	neonConfig.webSocketConstructor = ws;
	const connectionString = `${ctx.env.DATABASE_URL}`;
	const pool = new Pool({ connectionString });
	const adapter = new PrismaNeon(pool);
	const prisma = new PrismaClient({ adapter });
	return enhance(prisma, {}, { kinds: ['delegate'] });
};

// TRPC Adapter
app.use(
	'/trpc/*',
	trpcServer({
		router: router,
		createContext: (_opts, ctx) => {
			return { prisma: createPrismaContext(ctx) } satisfies TrpcContext;
		},
	}),
);

// Zenstack Adapter
app.use(
	'/api/model/*',
	createHonoHandler({
		getPrisma: (ctx) => {
			return createPrismaContext(ctx);
		},
	}),
);

export default app;