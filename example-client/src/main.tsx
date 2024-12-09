import '@mantine/core/styles.css';
import '~client/index.css';
import '~client/styles/button.css';
import '~client/styles/input.css';
import '~client/styles/modal.css';
import '~client/styles/tooltip.css';
import '~client/styles/form.css';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { httpLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { zsuiConfig } from '~client/form/form-config';
import { theme } from '~client/routes/-mantine-theme';
import { routeTree } from '~client/routeTree.gen';
import { queryClient } from '~client/utils/query-client';
import type { AppRouter } from '~server/api';
import { Provider as ZenStackHooksProvider } from '~zenstack/hooks';
import { ZenStackUIProvider } from '~zenstack-ui/utils/provider';

// --------------------------------------------------------------------------------
// TanStack Router Setup
const router = createRouter({ routeTree });
declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

// --------------------------------------------------------------------------------
// TanStack Devtools Setup (bind to sidebar buttons)
export const tanStackRouterDevToolsOpenBtnId = 'tanstack-router-open-btn';
export const openTanStackRouterDevtools = () => {
	const btn = document.querySelector(`#${tanStackRouterDevToolsOpenBtnId}`);
	if (btn) (btn as HTMLButtonElement).click();
	else console.error('TanStack Router Devtools button not found');
};
export const openTanStackReactQueryDevtools = () => {
	const btn = document.querySelector('.tsqd-open-btn');
	if (btn) (btn as HTMLButtonElement).click();
	else console.error('TanStack React Query Devtools button not found');
};
// Normally, you don't want devtools to show in prod, but this is useful for the demo.
const ReactQueryDevtoolsProduction = React.lazy(() =>
	import('@tanstack/react-query-devtools/build/modern/production.js').then(
		d => ({
			default: d.ReactQueryDevtools,
		}),
	),
);

// --------------------------------------------------------------------------------
// Server URL Setup
let serverUrl;
if (import.meta.env.MODE === 'development') {
	// Dev - use localhost server port (check example-server/wrangler.toml for port)
	serverUrl = `http://localhost:3003`;
} else {
	// Prod - use production server URL
	serverUrl = import.meta.env.VITE_SERVER_URL;
}

// --------------------------------------------------------------------------------
// TRPC Setup
const trpcLinks = [httpLink({ url: `${serverUrl}/trpc` })];
export const trpc = createTRPCReact<AppRouter>();
const trpcClient = trpc.createClient({ links: trpcLinks });

// --------------------------------------------------------------------------------
// Render
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<React.StrictMode>
			<trpc.Provider client={trpcClient} queryClient={queryClient}>
				<QueryClientProvider client={queryClient}>
					<ZenStackHooksProvider value={{ endpoint: `${serverUrl}/api/model` }}>
						<MantineProvider theme={theme} defaultColorScheme="dark">
							<ZenStackUIProvider config={zsuiConfig}>
								<ModalsProvider>
									<RouterProvider router={router} />
									<ReactQueryDevtools initialIsOpen={false} />
									{import.meta.env.PROD && (
										<React.Suspense fallback={null}>
											<ReactQueryDevtoolsProduction initialIsOpen={false} />
										</React.Suspense>
									)}
									<TanStackRouterDevtools
										router={router}
										initialIsOpen={false}
										toggleButtonProps={{ id: tanStackRouterDevToolsOpenBtnId, className: '!hidden' }}
									/>
								</ModalsProvider>
							</ZenStackUIProvider>
						</MantineProvider>
					</ZenStackHooksProvider>
				</QueryClientProvider>
			</trpc.Provider>
		</React.StrictMode>,
	);
}
