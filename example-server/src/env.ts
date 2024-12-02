import { dotenvLoad } from 'dotenv-mono';
import { cleanEnv, url } from 'envalid';

// Check client and example for .dev.vars
const clientEnv = dotenvLoad({
	path: 'example-client/.dev.vars',
}).env;
const serverEnv = dotenvLoad({
	path: 'example-server/.dev.vars',
}).env;

cleanEnv(clientEnv, {
	DATABASE_URL: url(),
	DIRECT_URL: url(),
	VITE_SERVER_URL: url(),
	WEBSITE_URL: url(),
});

cleanEnv(serverEnv, {
	DATABASE_URL: url(),
	DIRECT_URL: url(),
	VITE_SERVER_URL: url(),
	WEBSITE_URL: url(),
});
