import { Checkbox, MultiSelect, NumberInput, TextInput } from '@mantine/core';
import { Button } from '@mantine/core';

import { SearchableSelect } from '~client/form/lib/searchable-select';
import * as hooks from '~zenstack/hooks';
import metadata from '~zenstack/hooks/__model_meta';
import * as schemas from '~zenstack/zod/models';
import { type Field, FieldType } from '~zenstack-ui/metadata';
import type { MapFieldTypeToElement, MapSubmitTypeToButton, SubmitButtonProps, ZenstackUIConfigType } from '~zenstack-ui/utils/provider';

const mapFieldTypeToElement: MapFieldTypeToElement = {
	[FieldType.Boolean]: Checkbox,
	[FieldType.String]: TextInput,
	[FieldType.Int]: NumberInput,
	[FieldType.Float]: NumberInput,
	[FieldType.Enum]: SearchableSelect,
	[FieldType.ReferenceSingle]: SearchableSelect,
	[FieldType.ReferenceMultiple]: MultiSelect,
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

// Customize metadata
export const meta = metadata as EnhancedMetadata<typeof metadata>;
meta.models.item.fields.id.hidden = true;
meta.models.room.fields.id.hidden = true;
meta.models.room.fields.aiSummary.label = 'AI Generated Summary';

// All forms that reference the room model will use the room name instead of id in the Select component
meta.models.room.fields.id.displayFieldForReferencePicker = meta.models.room.fields.name.name;

// Make the owner field dependent on the room field. Owner select will be disabled until room is selected
meta.models.item.fields.ownerName.dependsOn = ['roomId'];
// TODO: In the future, we should use a prisma filter instead of directly filtering on the client side
// In the item form, filter the room picker to only show rooms that match the owner's room
meta.models.item.fields.ownerName.filter = (itemFields: typeof meta.models.item.fields, ownerFields: typeof meta.models.person.fields) => {
	if (itemFields.roomId === undefined) return true;
	return ownerFields.roomId === itemFields.roomId;
};

export const zenstackUIConfig: ZenstackUIConfigType = {
	hooks: hooks,
	schemas: schemas,
	metadata: meta,
	elementMap: mapFieldTypeToElement,
	submitButtons: submitButtonMap,
	enumLabelTransformer: (label: string) => label.replace(/_/g, ' '),
};
