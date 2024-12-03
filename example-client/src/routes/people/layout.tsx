import { FloatingIndicator, Pagination, TextInput, UnstyledButton } from '@mantine/core';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { modelNames } from '~client/form/form-config';
import List from '~client/form/lib/list';
import { ListHeader } from '~client/form/lib/list-header';
import { validateSearch } from '~client/utils/utils';
import { type Prisma } from '~zenstack/models';
import { useZSPagination } from '~zenstack-ui/list/list';

export const Route = createFileRoute('/people')({
	component: PeopleLayout,
	validateSearch,
});

function PeopleLayout() {
	const params = Route.useParams() as { id?: string };
	const name = params.id;
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	// Person query - search filter
	const personQuery = {
		include: { },
		where: { name: { contains: search.search, mode: 'insensitive' } },
	} satisfies Prisma.PersonFindManyArgs;
	type PersonPayload = Prisma.PersonGetPayload<typeof personQuery>;

	// Pagination
	const pagination = useZSPagination({
		model: modelNames.person,
		pageSize: 10,
		query: personQuery,
	});
	useEffect(() => {
		// Reset pagination when search changes
		pagination.goToPage(1);
	}, [search.search]);

	// List Mode Controller
	const modes = ['normal', 'infinite', 'paginated'] as const;
	const [listMode, setListMode] = useState<'normal' | 'infinite' | 'paginated'>('normal');
	const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
	const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});
	const setControlRef = (mode: string) => (node: HTMLButtonElement | null) => {
		controlsRefs[mode] = node;
		setControlsRefs(controlsRefs);
	};

	return (
		<div className="page">
			{/* List View */}
			<div className="left-list">

				<div className="list-margin">
					{/* Header */}
					<ListHeader title="People" model={modelNames.person} />

					{/* Search Input */}
					<TextInput
						placeholder="Search"
						value={search.search || ''}
						onChange={e => navigate({ search: { search: e.target.value } })}
						className="mb-2"
					/>

					{/* List Mode Control */}
					<div className="relative mb-2 flex rounded border border-bd-light p-1" ref={setRootRef}>
						<FloatingIndicator
							target={controlsRefs[listMode]}
							parent={rootRef}
							className="rounded bg-bd-light shadow-sm"
						/>
						{modes.map(mode => (
							<UnstyledButton
								variant="unstyled"
								key={mode}
								className="z-10 flex-1 py-1 text-center text-sm capitalize"
								ref={setControlRef(mode)}
								onClick={() => setListMode(mode)}
							>
								{mode}
							</UnstyledButton>
						))}
					</div>
				</div>

				{/* List - Normal */}
				{listMode === 'normal' && (
					<List<PersonPayload>
						mode="normal"
						model={modelNames.person}
						query={personQuery}
						route="/people/$id"
						itemId={name}
						search={search}
						render={person => (
							<p className="text-sm">{person.name}</p>
						)}
					/>
				)}

				{/* List - Infinite */}
				{listMode === 'infinite' && (
					<List<PersonPayload>
						mode="infinite"
						pageSize={10}
						model={modelNames.person}
						query={personQuery}
						route="/people/$id"
						itemId={name}
						search={search}
						render={person => (
							<p className="text-sm">{person.name}</p>
						)}
					/>
				)}

				{/* List - Paginated */}
				{listMode === 'paginated' && (
					<>
						<List<PersonPayload>
							mode="paginated"
							pagination={pagination}
							route="/people/$id"
							itemId={name}
							search={search}
							render={person => (
								<p className="text-sm">{person.name}</p>
							)}
						/>
						<div className="list-margin items-center justify-center py-2">
							<Pagination
								siblings={1}
								withEdges
								boundaries={1}
								value={pagination.page}
								total={pagination.totalPages}
								onChange={page => pagination.goToPage(page)}
							/>
						</div>
					</>
				)}

			</div>

			{/* Detail View */}
			<div className="right-detail">
				{name ? <Outlet /> : <p>Select a person to view details</p>}
			</div>
		</div>
	);
}
