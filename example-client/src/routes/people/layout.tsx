import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

import { ListHeader } from '~client/form/lib/list-header';
import ListSkeleton from '~client/form/lib/skeleton';
import type { PersonSchema } from '~zenstack/zod/models';
import { ZenstackList } from '~zenstack-ui/list/list';

export const Route = createFileRoute('/people')({
	component: PeopleLayout,
});

function PeopleLayout() {
	const params = Route.useParams() as { id?: string };
	const name = params.id;

	return (
		<div className="page">
			{/* List View */}
			<div className="left-list">
				<ListHeader title="People" model="Person" />
				<ZenstackList<typeof PersonSchema._type>
					model="Person"
					skeleton={<ListSkeleton />}
					render={person => (
						<Link
							key={person.name}
							to="/people/$id"
							params={{ id: person.name }}
							className="list-item"
							data-selected={person.name === name}
						>
							<p className="text-sm">{person.name}</p>
						</Link>
					)}
				/>
			</div>

			{/* Detail View */}
			<div className="right-detail">
				{name ? <Outlet /> : <p>Select a person to view details</p>}
			</div>
		</div>
	);
}
