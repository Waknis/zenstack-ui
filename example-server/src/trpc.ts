import type { PrismaClient } from '@prisma/client';
import { initTRPC } from '@trpc/server';

import { enhance } from '~zenstack/enhance-edge';

export interface TrpcContext {
	prisma: ReturnType<typeof enhance<PrismaClient>>
}
export const t = initTRPC.context<TrpcContext>().create();

/** * Middleware to enable error logging for trpc */
export const loggedProcedure = t.procedure.use(async (opts) => {
	const start = Date.now();

	const result = await opts.next();

	const durationMs = Date.now() - start;
	const meta = { path: opts.path, type: opts.type, durationMs };

	if (!result.ok) {
		console.error(`Error for ${JSON.stringify(meta)}\n${JSON.stringify(result.error)}`);
	}

	return result;
});
export const p = loggedProcedure;

/** Use TS types for trpc */
export const trpcType = <T>() => ({
	parse: (data: unknown): T => data as T,
});
