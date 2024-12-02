import { Checkbox, MultiSelect, NumberInput, TextInput } from '@mantine/core';
import { Button } from '@mantine/core';

import { SearchableSelect } from '~client/form/lib/searchable-select';
import { queryClient } from '~client/utils/query-client';
import * as hooks from '~zenstack/hooks';
import metadata from '~zenstack/hooks/__model_meta';
import * as schemas from '~zenstack/zod/models';
import { type Field, FieldType } from '~zenstack-ui/metadata';
import type { MapFieldTypeToElement, MapSubmitTypeToButton, SubmitButtonProps, ZenstackUIConfigType } from '~zenstack-ui/utils/provider';

// --------------------------------------------------------------------------------
// Form Config - Element Mapping
// --------------------------------------------------------------------------------
const mapFieldTypeToElement: MapFieldTypeToElement = {
	[FieldType.Boolean]: Checkbox,
	[FieldType.String]: TextInput,
	[FieldType.Int]: NumberInput,
	[FieldType.Float]: NumberInput,
	[FieldType.Enum]: SearchableSelect,
	[FieldType.ReferenceSingle]: SearchableSelect,
	[FieldType.ReferenceMultiple]: MultiSelect,

	// Example of adding custom types
	MyCustomType: () => <div>My Custom Type</div>,
};

const CreateButton = ({ model, ...props }: SubmitButtonProps) => {
	return (
		<div className="mt-4 flex justify-end">
			<Button {...props}>Create {model}</Button>
		</div>
	);
};

const UpdateButton = ({ model, ...props }: SubmitButtonProps) => {
	return (
		<div className="mt-4 flex justify-end">
			<Button {...props}>Update {model}</Button>
		</div>
	);
};

const submitButtonMap: MapSubmitTypeToButton = {
	create: CreateButton,
	update: UpdateButton,
};

// --------------------------------------------------------------------------------
// Extract model names from metadata
// --------------------------------------------------------------------------------
type ModelNames = {
	[K in keyof typeof metadata['models']]: typeof metadata['models'][K]['name']
};
/** List of all model names */
export const modelNames = Object.fromEntries(
	Object.entries(metadata.models).map(([key, model]) => [key, model.name]),
) as ModelNames;

export const typedModelFields = <T extends keyof typeof meta.models>(modelName: T) => {
	return Object.fromEntries(
		Object.entries(meta.models[modelName].fields).map(([key, field]) => [key, field.name]),
	) as Record<keyof typeof meta.models[T]['fields'], string>;
};

// --------------------------------------------------------------------------------
// Enhanced metadata
// --------------------------------------------------------------------------------
/** Enhance original zenstack metadata with custom fields for ZenstackForm */
type EnhancedMetadata<T> = T & {
	models: {
		[K in keyof T['models']]: {
			[P in keyof T['models'][K]]: P extends 'fields'
				? { [F in keyof T['models'][K]['fields']]: T['models'][K]['fields'][F] & Field }
				: T['models'][K][P]
		}
	}
};

// --------------------------------------------------------------------------------
// Customize metadata
// --------------------------------------------------------------------------------
export const meta = metadata as EnhancedMetadata<typeof metadata>;
meta.models.item.fields.id.hidden = true;
meta.models.houseRoom.fields.id.hidden = true;
meta.models.houseRoom.fields.aiSummary.label = 'AI Generated Summary';

// All forms that reference the room model will use the room name instead of id in the Select component
meta.models.houseRoom.fields.id.displayFieldForReferencePicker = meta.models.houseRoom.fields.name.name;

// Make the owner field dependent on the room field. Owner select will be disabled until room is selected
meta.models.item.fields.ownerName.dependsOn = ['roomId'];
// TODO: In the future, we should use a prisma filter instead of directly filtering on the client side
// In the item form, filter the room picker to only show rooms that match the owner's room
meta.models.item.fields.ownerName.filter = (itemFields: typeof meta.models.item.fields, ownerFields: typeof meta.models.person.fields) => {
	if (itemFields.roomId === undefined) return true;
	return ownerFields.roomId === itemFields.roomId;
};

// --------------------------------------------------------------------------------
// Export config
// --------------------------------------------------------------------------------
export const zenstackUIConfig: ZenstackUIConfigType = {
	hooks,
	schemas,
	metadata: meta,
	elementMap: mapFieldTypeToElement,
	submitButtons: submitButtonMap,
	enumLabelTransformer: (label: string) => label.replace(/_/g, ' '),
	globalClassName: 'flex flex-col gap-2',
	queryClient,
};
