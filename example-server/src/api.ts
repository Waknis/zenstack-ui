import { generalRouter } from '~server/routers/general';
import { t } from '~server/trpc';

export const router = t.router({
	general: generalRouter,
});

export type AppRouter = typeof router;
