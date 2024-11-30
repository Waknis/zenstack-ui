import { Button, Divider, Textarea } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { useRef } from 'react';

import { meta } from '~client/form/form-config';
import { DetailHeader } from '~client/form/lib/detail-header';
import MantineZenstackUpdateForm from '~client/form/lib/mantine-update-form';
import { type ZenstackFormRef } from '~zenstack-ui/index';

export const Route = createFileRoute('/rooms/$id')({
	component: PeopleDetail,
});

function PeopleDetail() {
	const params = Route.useParams() as { id: string };
	const id = Number(params.id);

	// Example of useRef to get the form
	const formRef = useRef<ZenstackFormRef>(null);

	return (
		<div>
			<DetailHeader model="Room" id={id} route="/rooms" />
			<MantineZenstackUpdateForm formRef={formRef} model="Room" id={id} route="/rooms/$id">
				<div className="mt-4 flex flex-col gap-2">
					<Divider />
					<div data-placeholder-name={meta.models.room.fields.description.name} />
					<Divider />
				</div>
				<div className="">
					<Textarea
						data-field-name={meta.models.room.fields.aiSummary.name}
						label="AI Summary"
						placeholder="AI Summary"
					/>
				</div>
			</MantineZenstackUpdateForm>
		</div>
	);
}
