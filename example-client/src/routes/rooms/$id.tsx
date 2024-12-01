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

const roomFields = meta.models.room.fields;

function PeopleDetail() {
	const params = Route.useParams() as { id: string };
	const id = Number(params.id);

	// Example of useRef to get the form
	const formRef = useRef<ZenstackFormRef>(null);

	return (
		<div>
			<DetailHeader model="Room" id={id} route="/rooms" />
			<MantineZenstackUpdateForm formRef={formRef} model="Room" id={id} route="/rooms/$id">
				<div className="flex w-full gap-4">
					{/* A placeholder example. This gets replaced by an input component */}
					<div className="grow" data-placeholder-name={roomFields.description.name} />

					{/* A custom element example. This will be directly used by the form */}
					<Textarea
						className="grow"
						autosize
						data-field-name={roomFields.aiSummary.name}
						label="AI Summary"
						placeholder="AI Summary"
					/>
				</div>
			</MantineZenstackUpdateForm>
		</div>
	);
}
