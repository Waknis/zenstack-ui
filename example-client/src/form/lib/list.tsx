/* eslint-disable @typescript-eslint/no-explicit-any */
import { ScrollArea } from '@mantine/core';
import { Link } from '@tanstack/react-router';

import ListSkeleton from '~client/form/lib/skeleton';
import type { RouteFullPaths } from '~client/routes/-sidebar';
import { ZSList, type ZSListProps } from '~zenstack-ui/list/list';

interface ListWrapperProps<T> extends ZSListProps<T> {
	route: RouteFullPaths
	itemId?: number | string
	search?: string
}

function ListWrapper<T extends Record<string, any>>({ itemId, search, route, ...zsListProps }: ListWrapperProps<T>) {
	return (
		<ScrollArea className="list-scrollarea">
			<ZSList<T>
				{...zsListProps}

				// Defaults
				skeleton={zsListProps.skeleton ?? <ListSkeleton />}
				noResults={zsListProps.noResults ?? <p className="text-gray-500">No results found</p>}

				// Render
				render={(item: T, id: string | number) => (
					<Link
						key={id}
						to={route}
						params={{ id: id.toString() }}
						className="list-item"
						data-selected={id === itemId}
						search={search}
					>
						{zsListProps.render(item, id)}
					</Link>
				)}
			/>
		</ScrollArea>
	);
}

export default ListWrapper;
