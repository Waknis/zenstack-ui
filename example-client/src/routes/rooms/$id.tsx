import { createFileRoute } from '@tanstack/react-router';

import { DetailHeader } from '~client/form/lib/detail-header';
import MantineZenstackUpdateForm from '~client/form/lib/mantine-update-form';

export const Route = createFileRoute('/rooms/$id')({
	component: PeopleDetail,
});

function PeopleDetail() {
	const params = Route.useParams() as { id: string };
	const id = Number(params.id);

	return (
		<div>
			<DetailHeader model="Room" id={id} route="/rooms" />
			<MantineZenstackUpdateForm model="Room" id={id} route="/rooms/$id" />
		</div>
	);
}
