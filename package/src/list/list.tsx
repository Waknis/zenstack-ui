/* eslint-disable @typescript-eslint/no-explicit-any */

import { Fragment, useEffect, useRef } from 'react';
import React from 'react';

import { UseCountHook, UseQueryHook } from '../metadata';
import { useZenstackUIProvider } from '../utils/provider';
import { getIdField, getModelFields } from '../utils/utils';

interface BaseListProps<T> {
	render: (item: T, id: string | number) => React.ReactNode
	skeleton?: React.ReactNode
	noResults?: React.ReactNode
}

type NormalListProps<T> = BaseListProps<T> & {
	mode?: 'normal'
	model: string
	query?: any
};

type InfiniteListProps<T> = BaseListProps<T> & {
	mode: 'infinite'
	model: string
	query?: any
	pageSize?: number
};

type PaginatedListProps<T> = BaseListProps<T> & {
	mode: 'paginated'
	pagination: PaginationState
};

export type ZSListProps<T> = NormalListProps<T> | InfiniteListProps<T> | PaginatedListProps<T>;

/** Standard list that loads all data at once */
const NormalList = <T extends Record<string, any>>(props: NormalListProps<T>) => {
	const { model, render, skeleton, query, noResults } = props;
	const { hooks, metadata } = useZenstackUIProvider();
	const fields = getModelFields(metadata, model);
	const idField = getIdField(fields);

	const useFindManyHook = hooks[`useFindMany${model}`] as UseQueryHook<T>;
	const { data } = useFindManyHook(query);

	if (!data) return skeleton || null;
	if (data.length === 0) return noResults || null;

	return (
		<>
			{data.map(item => (
				<div key={item[idField.name]}>
					{render(item, item[idField.name])}
				</div>
			))}
		</>
	);
};

/** Infinite list that loads more data when you scroll to the end of the list */
/** Component for infinite scrolling list that loads more data when scrolling to the end */
const InfiniteList = <T extends Record<string, any>>(props: InfiniteListProps<T>) => {
	// Extract props and get provider hooks/metadata
	const { model, render, skeleton, query, noResults, pageSize = 10 } = props;
	const { hooks, metadata } = useZenstackUIProvider();
	const fields = getModelFields(metadata, model);
	const idField = getIdField(fields);
	const loadMoreRef = useRef<HTMLDivElement>(null);

	// Get infinite query hook for this model
	const useInfiniteFindManyHook = hooks[`useInfiniteFindMany${model}`] as any;
	const fetchArgs = {
		...query,
		take: pageSize,
	};

	// Setup infinite query with pagination
	const { data, fetchNextPage, hasNextPage } = useInfiniteFindManyHook(fetchArgs, {
		getNextPageParam: (lastPage: T[], pages: T[][]) => {
			// If last page has less items than pageSize, we've reached the end
			if (lastPage.length < pageSize) {
				return undefined;
			}
			// Calculate how many items we've fetched so far
			const fetched = pages.flatMap(item => item).length;
			return {
				...fetchArgs,
				skip: fetched,
			};
		},
	});

	// Setup intersection observer for infinite scroll
	useEffect(() => {
		// Create observer that triggers when element becomes visible
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasNextPage) {
					fetchNextPage();
				}
			},
			{ threshold: 0.1 },
		);

		const currentRef = loadMoreRef.current;
		if (currentRef) {
			observer.observe(currentRef);

			// Additional check to handle cases where intersection observer might miss
			const checkVisibility = () => {
				const entry = observer.takeRecords()[0];
				if (entry?.isIntersecting && hasNextPage) {
					fetchNextPage();
				}
			};

			const timer = setInterval(checkVisibility, 100);

			return () => {
				observer.disconnect();
				clearInterval(timer);
			};
		}

		return () => observer.disconnect();
	}, [fetchNextPage, hasNextPage, data]);

	// Handle loading and empty states
	if (!data) return skeleton || null;
	if (data.pages[0]?.length === 0) return noResults || null;

	return (
		<>
			{/* Render all pages of data */}
			{data.pages.map((items: T[], i: number) => (
				<Fragment key={i}>
					{items.map(item => (
						<div key={item[idField.name]}>
							{render(item, item[idField.name])}
						</div>
					))}
				</Fragment>
			))}
			{/* Invisible element for intersection observer */}
			<div ref={loadMoreRef} style={{ height: '10px' }} />
		</>
	);
};

interface PaginationOptions {
	query?: any
	model: string
	pageSize?: number
}

interface PaginationState extends PaginationOptions {
	items: any[]
	page: number
	totalPages: number
	totalItems: number
	goToPage: (page: number) => void
}

/** Hook to get pagination state for a paginated list */
export const useZSPagination = (props: PaginationOptions): PaginationState => {
	const { hooks } = useZenstackUIProvider();
	const pageSize = props.pageSize || 10;
	const [page, setPage] = React.useState(1);

	// Get count
	const countHook = hooks[`useCount${props.model}`] as UseCountHook<number>;
	const { data: totalItems = 0 } = countHook({
		...props.query,
		include: undefined, // can't use include in count queries
	});
	const totalPages = Math.ceil(totalItems / pageSize);

	// Get items
	const useFindManyHook = hooks[`useFindMany${props.model}`] as UseQueryHook<any>;
	const { data: itemList } = useFindManyHook({
		...props.query,
		skip: (page - 1) * pageSize,
		take: pageSize,
	});

	const goToPage = (newPage: number) => {
		setPage(Math.max(1, Math.min(newPage, totalPages)));
	};

	return {
		...props,
		items: itemList,
		page,
		totalPages,
		totalItems,
		goToPage,
	};
};

/** Paginated list */
const PaginatedList = <T extends Record<string, any>>(props: PaginatedListProps<T>) => {
	const { render, skeleton, noResults, pagination } = props;
	const { metadata } = useZenstackUIProvider();
	const fields = getModelFields(metadata, pagination.model);
	const idField = getIdField(fields);

	if (!pagination || !pagination.items) return skeleton || null;
	if (pagination.items.length === 0) return noResults || null;
	const data = pagination.items;

	return (
		<>
			{data.map(item => (
				<div key={item[idField.name]}>
					{render(item, item[idField.name])}
				</div>
			))}
		</>
	);
};

/** zenstack-ui list component, with support for normal, infinite, and paginated modes */
export const ZSList = <T extends Record<string, any>>(props: ZSListProps<T>) => {
	const { mode } = props;
	if (mode === 'infinite') {
		return <InfiniteList<T> {...props} />;
	} else if (mode === 'paginated') {
		return <PaginatedList<T> {...props} />;
	}

	// Default to normal list
	return <NormalList<T> {...props} />;
};
