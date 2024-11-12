import { LoadingOverlay } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { DetailHeader } from '~client/form/lib/detail-header';
import MantineZenstackUpdateForm from '~client/form/lib/mantine-update-form';
import { ZenstackUpdateForm } from '~zenstack-ui/form/form';

export const Route = createFileRoute('/people/$id')({
	component: PeopleDetail,
});

function PeopleDetail() {
	const params = Route.useParams() as { id: string };
	const name = params.id;

	return (
		<div>
			<DetailHeader model="Person" id={name} route="/people" />
			<MantineZenstackUpdateForm model="Person" id={name} route="/people/$id" />
		</div>
	);
}
