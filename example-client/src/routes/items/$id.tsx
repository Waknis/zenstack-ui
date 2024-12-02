import { Accordion } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

import { modelNames } from '~client/form/form-config';
import { DetailHeader } from '~client/form/lib/detail-header';
import MZSUpdateForm from '~client/form/lib/mantine-update-form';

export const Route = createFileRoute('/items/$id')({
	component: ItemsDetail,
});

function ItemsDetail() {
	const params = Route.useParams() as { id: string };
	const id = Number(params.id);

	return (
		<div className="form-container">
			<div>
				<DetailHeader model={modelNames.item} id={id} route="/items" />
				<MZSUpdateForm model={modelNames.item} id={id} route="/items/$id" />
			</div>

			<ItemsDetailCode />
		</div>
	);
}

function ItemsDetailCode() {
	return (
		<Accordion variant="filled" className="mb-4">
			<Accordion.Item value="code">
				<Accordion.Control>Show Code</Accordion.Control>
				<Accordion.Panel>
					<pre>
						<code>
							{`
function ItemsDetail() {
	const params = Route.useParams() as { id: string };
	const id = Number(params.id);

	return (
		<div>
			<DetailHeader model="Item" id={id} route="/items" />
			<ZenstackUpdateForm model="Item" id={id} />
		</div>
	);
}
								`}
						</code>
					</pre>
				</Accordion.Panel>
			</Accordion.Item>
		</Accordion>
	);
}
