import 'dotenv/config';

// import { Pool } from '@prisma/pg-worker'; // Normal postgres, like Supabase
// import { PrismaPg } from '@prisma/adapter-pg-worker'; // Normal postgres, like Supabase
import { trpcServer } from '@hono/trpc-server';
import { neonConfig, Pool } from '@neondatabase/serverless'; // Neon
import { PrismaNeon } from '@prisma/adapter-neon'; // Neon
import { PrismaClient } from '@prisma/client';
import { createHonoHandler } from '@zenstackhq/server/hono';
import { Hono } from 'hono';
import { cors as honoCors } from 'hono/cors';
import ws from 'ws';

import { router } from '~server/api';
import { enhance } from '~zenstack/enhance-edge';

interface Bindings {
	ENVIRONMENT: 'development' | 'production'
	DATABASE_URL: string // your postgres database URL
	WEBSITE_URL: string // your client website URL (ex: hosted on cloudflare pages)
}

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', async (c, next) => {
	return honoCors({
		origin: c.env.ENVIRONMENT === 'development' ? '*' : c.env.WEBSITE_URL,
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization', 'x-trpc-source'],
	})(c, next);
});

app.use(
	'/trpc/*',
	trpcServer({
		router: router,
	}),
);

app.use(
	'/api/model/*',
	createHonoHandler({
		getPrisma: (ctx) => {
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
		},
	}),
);

export default {
	port: 3003,
	fetch: app.fetch,
};
