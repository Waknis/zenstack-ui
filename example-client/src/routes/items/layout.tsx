import { TextInput } from '@mantine/core';
import { createFileRoute, Outlet } from '@tanstack/react-router';

import { modelNames } from '~client/form/form-config';
import List from '~client/form/lib/list';
import { ListHeader } from '~client/form/lib/list-header';
import { validateSearch } from '~client/utils/utils';
import type { Prisma } from '~zenstack/models';

export const Route = createFileRoute('/items')({
	component: ItemsLayout,
	validateSearch,
});

function ItemsLayout() {
	const params = Route.useParams() as { id?: number };
	const itemId = Number(params.id);
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	const itemQuery = {
		include: {},
		where: { name: { contains: search.search, mode: 'insensitive' } },
	} satisfies Prisma.ItemFindManyArgs;
	type ItemPayload = Prisma.ItemGetPayload<typeof itemQuery>;

	return (
		<div className="page">

			{/* List View */}
			<div className="left-list">

				<div className="list-margin">
					{/* Header */}
					<ListHeader title="Items" model={modelNames.item} />

					{/* Search Input */}
					<TextInput
						placeholder="Search"
						value={search.search || ''}
						onChange={e => navigate({ search: { search: e.target.value } })}
						className="mb-4"
					/>
				</div>

				{/* List */}
				<List<ItemPayload>
					model={modelNames.item}
					query={itemQuery}
					route="/items/$id"
					itemId={itemId}
					search={search}
					render={item => (
						<>
							<p className="text-sm">{item.name}</p>
							<p className="text-sm text-gray-500"> {item.ownerName}, {item.category}</p>
						</>
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
