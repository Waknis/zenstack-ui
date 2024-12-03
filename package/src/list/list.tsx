/* eslint-disable @typescript-eslint/no-explicit-any */

import { UseQueryHook } from '../metadata';
import { useZenstackUIProvider } from '../utils/provider';
import { getIdField, getModelFields } from '../utils/utils';

export interface ZSListProps<T> {
	model: string
	render: (item: T, id: string | number) => React.ReactNode
	skeleton?: React.ReactNode
	query?: any
	noResults?: React.ReactNode
}

export const ZSList = <T extends Record<string, any>>(props: ZSListProps<T>) => {
	const { model, render, skeleton, query, noResults } = props;
	const { hooks, metadata } = useZenstackUIProvider();
	const useFindManyHook = hooks[`useFindMany${model}`] as UseQueryHook<T>;
	const { data } = useFindManyHook(query);
	const fields = getModelFields(metadata, model);
	const idField = getIdField(fields);

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
