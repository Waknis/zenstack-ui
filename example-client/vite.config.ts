import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

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
			'/api': {
				target: 'http://localhost:3003',
				changeOrigin: true,
				headers: {
					Origin: 'https://zenstack-ui-demo.kirankunigiri.com',
				},
			},
			'/trpc': {
				target: 'http://localhost:3003',
				changeOrigin: true,
				headers: {
					Origin: 'https://zenstack-ui-demo.kirankunigiri.com',
				},
			},
		},
	},
});
