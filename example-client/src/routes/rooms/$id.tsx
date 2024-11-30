import { Button, Textarea } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { useRef } from 'react';

import { meta } from '~client/form/form-config';
import { DetailHeader } from '~client/form/lib/detail-header';
import MantineZenstackUpdateForm from '~client/form/lib/mantine-update-form';
import type { ZenstackFormRef } from '~zenstack-ui/index';

export const Route = createFileRoute('/rooms/$id')({
	component: PeopleDetail,
});

// Override metadata to hide the aiSummary field
const metadataOverride = JSON.parse(JSON.stringify(meta));
metadataOverride.models.room.fields.aiSummary.hidden = true;

function PeopleDetail() {
	const params = Route.useParams() as { id: string };
	const id = Number(params.id);

	const formRef = useRef<ZenstackFormRef>(null);
	const form = formRef.current?.form;

	const handleSomeAction = () => {
		formRef.current?.form.reset();
	};

	return (
		<div>
			<DetailHeader model="Room" id={id} route="/rooms" />
			<MantineZenstackUpdateForm formRef={formRef} model="Room" id={id} route="/rooms/$id" metadataOverride={metadataOverride}>
				<Textarea
					data-field-name={meta.models.room.fields.aiSummary.name}
					label="AI Summary"
					placeholder="AI Summary"
				/>
			</MantineZenstackUpdateForm>
		</div>
	);
}
