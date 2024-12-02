import { Divider, Textarea } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { useRef } from 'react';

import { modelNames, typedModelFields } from '~client/form/form-config';
import { DetailHeader } from '~client/form/lib/detail-header';
import MantineZenstackUpdateForm from '~client/form/lib/mantine-update-form';
import { ZenstackFormPlaceholder, type ZenstackFormRef } from '~zenstack-ui/index';

export const Route = createFileRoute('/rooms/$id')({
	component: PeopleDetail,
});

const roomFields = typedModelFields('room');

function PeopleDetail() {
	const params = Route.useParams() as { id: string };
	const id = Number(params.id);

	// Example of useRef to get the form
	const formRef = useRef<ZenstackFormRef>(null);

	return (
		<div>
			<DetailHeader model={modelNames.room} id={id} route="/rooms" />
			<MantineZenstackUpdateForm formRef={formRef} model={modelNames.room} id={id} route="/rooms/$id">
				<Divider mt="lg" my="md" variant="dashed" />
				<div className="flex w-full gap-4">

					{/* A placeholder example. This gets replaced by an input component */}
					<ZenstackFormPlaceholder className="grow" fieldName={roomFields.description} />
					{/* <ZenstackTest /> */}

					{/* A custom element example. This will be directly used by the form */}
					<Textarea
						className="grow"
						autosize
						data-field-name={roomFields.aiSummary}
						label="AI Summary"
						placeholder="AI Summary"
					/>
				</div>
			</MantineZenstackUpdateForm>
		</div>
	);
}

/** Test to make sure wrapped components still work with ZenstackFormPlaceholder */
const ZenstackTest = () => {
	return (
		<ZenstackFormPlaceholder className="grow" fieldName={roomFields.description} />
	);
};
