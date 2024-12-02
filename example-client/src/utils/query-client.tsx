import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { toast } from 'sonner';

// Query Client with UI notification logging
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: true,
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 60 * 24, // 1 day
		},
	},
	queryCache: new QueryCache({
		onError: (error, query) => {
			if (error instanceof TRPCClientError) {
				console.error('trpc query error');
				console.dir(error);
				toast.error(`TRPC Server Error: ${error.message}`);
			} else {
				console.error('ZenStack query error');
				// @ts-expect-error Need to find correct type for error
				const message = error['info']['message'];
				console.error('ZenStack Server Error:', message);
				toast.error(`ZenStack Server Error: ${message}`);
			}
		},
	}),
	mutationCache: new MutationCache({
		onError: (error, mutation) => {
			if (error instanceof TRPCClientError) {
				console.error('trpc mutation error');
				console.error('TRPC Server Error:', error.message);
				toast.error(`TRPC Server Error: ${error.message}`);
			} else {
				console.error('ZenStack mutation error');
				// @ts-expect-error Need to find correct type for error
				const message = error['info']['message'];
				console.error('ZenStack Server Error:', message);
				toast.error(`ZenStack Server Error: ${message}`);
			}
		},
	}),
});
