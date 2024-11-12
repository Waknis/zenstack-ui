import { p, t, trpcType } from '~server/trpc';

export const generalRouter = t.router({
	greet: p
		.input(trpcType<string>())
		.output(trpcType<string>())
		.query(({ input }) => {
			console.log('Hello ', input);
			return `Hello ${input}`;
		}),
});
