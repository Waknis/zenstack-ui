import { createFileRoute } from '@tanstack/react-router';

import { modelNames } from '~client/form/form-config';
import { DetailHeader } from '~client/form/lib/detail-header';
import MantineZenstackUpdateForm from '~client/form/lib/mantine-update-form';

export const Route = createFileRoute('/people/$id')({
	component: PeopleDetail,
});

function PeopleDetail() {
	const params = Route.useParams() as { id: string };
	const name = params.id;

	return (
		<div>
			<DetailHeader model={modelNames.person} id={name} route="/people" />
			<MantineZenstackUpdateForm model={modelNames.person} id={name} route="/people/$id" />
		</div>
	);
}
