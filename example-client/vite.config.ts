import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// See example-server/wrangler.toml for server port
const SERVER_URL = 'http://localhost:3003';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tsconfigPaths(),
		TanStackRouterVite({
			routeToken: 'layout',
		}),
	],
	envDir: '../',
	server: {
		proxy: {
			'/api': { target: SERVER_URL },
			'/trpc': { target: SERVER_URL },
		},
	},
});
