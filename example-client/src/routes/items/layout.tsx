import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

import { ListHeader } from '~client/form/lib/list-header';
import ListSkeleton from '~client/form/lib/skeleton';
import type { ItemSchema } from '~zenstack/zod/models';
import ZenstackList from '~zenstack-ui/list/list';

export const Route = createFileRoute('/items')({
	component: ItemsLayout,
});

function ItemsLayout() {
	const params = Route.useParams() as { id?: number };
	const itemId = Number(params.id);

	return (
		<div className="page">

			{/* List View */}
			<div className="left-list">

				{/* Header */}
				<ListHeader title="Items" model="Item" />

				{/* This is not much better than manually calling the hook */}
				{/* It will be improved when we add automatic filters, infinite scroll, etc. */}
				<ZenstackList<typeof ItemSchema._type>
					model="Item"
					skeleton={<ListSkeleton />}
					render={item => (
						<Link
							key={item.id}
							to="/items/$id"
							params={{ id: item.id.toString() }}
							className="list-item"
							data-selected={item.id === itemId}
						>
							<p className="text-sm">{item.name}</p>
							<p className="text-sm text-gray-500">{item.category}</p>
						</Link>
					)}
				/>
			</div>

			{/* Detail View */}
			<div className="right-detail overflow-y-scroll">
				{itemId ? <Outlet /> : <p>Select an item to view details</p>}
			</div>
		</div>
	);
}
