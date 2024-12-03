import { Button, ScrollArea, TextInput } from '@mantine/core';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

import { modelNames } from '~client/form/form-config';
import ListWrapper from '~client/form/lib/list';
import { ListHeader } from '~client/form/lib/list-header';
import ListSkeleton from '~client/form/lib/skeleton';
import { validateSearch } from '~client/utils/utils';
import { useCreateManyPerson } from '~zenstack/hooks';
import { type Prisma } from '~zenstack/models';
import { ZSList } from '~zenstack-ui/list/list';

export const Route = createFileRoute('/people')({
	component: PeopleLayout,
	validateSearch,
});

function PeopleLayout() {
	const params = Route.useParams() as { id?: string };
	const name = params.id;
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	const createManyPerson = useCreateManyPerson();

	const personQuery = {
		include: {},
		where: { name: { contains: search.search, mode: 'insensitive' } },
	} satisfies Prisma.PersonFindManyArgs;
	type PersonPayload = Prisma.PersonGetPayload<typeof personQuery>;

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
						className="mb-4"
					/>

					{/* Generator */}
					<Button
						className="min-h-8"
						onClick={() => {
							const randomNames = [
								'Liam', 'Emma', 'Noah', 'Olivia', 'Ethan', 'Ava', 'Mason', 'Sophia', 'Lucas', 'Isabella',
								'Oliver', 'Mia', 'Elijah', 'Charlotte', 'William', 'Amelia', 'James', 'Harper', 'Benjamin', 'Evelyn',
								'Henry', 'Abigail', 'Alexander', 'Emily', 'Sebastian', 'Elizabeth', 'Jack', 'Sofia', 'Daniel', 'Avery',
								'Michael', 'Ella', 'Samuel', 'Scarlett', 'David', 'Victoria', 'Joseph', 'Madison', 'Carter', 'Luna',
								'Owen', 'Grace', 'Wyatt', 'Chloe', 'John', 'Penelope', 'Luke', 'Layla', 'Gabriel', 'Riley',
								'Anthony', 'Zoey', 'Isaac', 'Nora', 'Grayson', 'Lily', 'Julian', 'Eleanor', 'Matthew', 'Hannah',
								'Leo', 'Lillian', 'Nathan', 'Addison', 'Thomas', 'Aubrey', 'Caleb', 'Ellie', 'Josh', 'Stella',
								'Ryan', 'Natalie', 'Adrian', 'Zoe', 'Adam', 'Leah', 'Ian', 'Hazel', 'Eric', 'Violet',
								'Wesley', 'Aurora', 'Austin', 'Savannah', 'Jordan', 'Audrey', 'Colin', 'Brooklyn', 'Blake', 'Bella',
								'Steven', 'Claire', 'Miles', 'Skylar', 'Robert', 'Lucy', 'Roman', 'Paisley', 'Carson', 'Everly',
								'Cooper', 'Anna', 'Kyle', 'Caroline', 'Parker', 'Nova', 'Marcus', 'Genesis', 'Vincent', 'Emilia',
							];

							createManyPerson.mutateAsync({
								skipDuplicates: true,
								data: randomNames.map(name => ({
									name,
									roomId: 29,
								})),
							});
						}}
					>Generate 100 Names
					</Button>
				</div>

				{/* List */}
				<ListWrapper<PersonPayload>
					model={modelNames.person}
					query={personQuery}
					route="/people/$id"
					itemId={name}
					search={search.search}
					render={person => (
						<>
							<p className="text-sm">{person.name}</p>
						</>
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
