import { Field, Metadata } from '../metadata';

export const getModelFields = (metadata: Metadata, model: string) => {
	const fields = metadata.models[model.toLowerCase()].fields;
	return fields;
};

export const getIdField = (fields: Record<string, Field>) => {
	return Object.values(fields).find(field => field.isId)!;
};
