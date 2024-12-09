import { Field, Metadata } from '../metadata';
import { ZenStackUIOptions } from './provider';

export const getModelFields = (metadata: Metadata, model: string) => {
	// Convert the first letter to lowercase to get the fields
	// model_meta generation converts the first letter into lowercase for model names
	const fields = metadata.models[model[0].toLowerCase() + model.slice(1)].fields;
	return fields;
};

export const getIdField = (fields: Record<string, Field>) => {
	return Object.values(fields).find(field => field.isId)!;
};

export const applyOptionsOverrides = (originalOptions: ZenStackUIOptions, overrides?: Partial<ZenStackUIOptions>) => {
	return {
		...originalOptions,
		...overrides,
	};
};
