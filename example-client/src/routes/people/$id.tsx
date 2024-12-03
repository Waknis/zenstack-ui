import { createFileRoute } from '@tanstack/react-router';

import { modelNames } from '~client/form/form-config';
import { DetailHeader } from '~client/form/lib/detail-header';
import MZSUpdateForm from '~client/form/lib/mantine-update-form';
import { validateSearch } from '~client/utils/utils';

export const Route = createFileRoute('/people/$id')({
	component: PeopleDetail,
	validateSearch,
});

function PeopleDetail() {
	const params = Route.useParams() as { id: string };
	const name = params.id;

	return (
		<div>
			<DetailHeader model={modelNames.person} id={name} route="/people" />
			<MZSUpdateForm model={modelNames.person} id={name} route="/people/$id" />
		</div>
	);
}
