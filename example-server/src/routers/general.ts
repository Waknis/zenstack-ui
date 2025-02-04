import { CustomRoomCreateSchema } from '~server/schemas';
import { p, t } from '~server/trpc';

export const generalRouter = t.router({
	createRoom: p
		.input(CustomRoomCreateSchema)
		.mutation(async ({ input, ctx }) => {
			console.log(input);

			const prisma = ctx.prisma;

			await prisma.houseRoom.create({
				data: {
					...input,
					aiSummary: 'This is a placeholder for an AI generated summary that would have been generated on the trpc server backend. This demo shows how you can replace a zod schema with a custom schema, and finish the mutation on the server side. (ex: here, the ai generated summary is removed from the zod schema to let the form submit pass on the client side, and the generation is delegated to the server side)',
				},
			});
		}),
});
