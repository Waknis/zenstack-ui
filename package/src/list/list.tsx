/* eslint-disable @typescript-eslint/no-explicit-any */
import { UseQueryHook } from '../metadata';
import { useZenstackUIProvider } from '../utils/provider';
import { getIdField, getModelFields } from '../utils/utils';

export interface ZenstackListProps<T> {
	model: string
	render: (item: T) => React.ReactNode
	skeleton?: React.ReactNode
}

export const ZenstackList = <T extends Record<string, any>>(props: ZenstackListProps<T>) => {
	const { model, render, skeleton } = props;
	const { hooks, metadata } = useZenstackUIProvider();
	const useFindManyHook = hooks[`useFindMany${model}`] as UseQueryHook<T>;
	const { data } = useFindManyHook();
	const fields = getModelFields(metadata, model);
	const idField = getIdField(fields);

	if (!data) return skeleton || null;

	return (
		<>
			{data.map(item => (
				<div key={item[idField.name]}>
					{render(item)}
				</div>
			))}
		</>
	);
};
