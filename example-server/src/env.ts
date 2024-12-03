import { dotenvLoad } from 'dotenv-mono';
import { cleanEnv, url } from 'envalid';

// Check client and example for .dev.vars
const rootEnv = dotenvLoad({
	path: '.env',
}).env;
const clientEnv = dotenvLoad({
	path: 'example-client/.dev.vars',
}).env;
const serverEnv = dotenvLoad({
	path: 'example-server/.dev.vars',
}).env;

// Validate all envs
const envs = [rootEnv, clientEnv, serverEnv];
for (const env of envs) {
	cleanEnv(env, {
		DATABASE_URL: url(),
		DIRECT_URL: url(),
		VITE_SERVER_URL: url(),
		WEBSITE_URL: url(),
	});
}
