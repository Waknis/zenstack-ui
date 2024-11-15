import { Checkbox, MultiSelect, NumberInput, TextInput } from '@mantine/core';
import { Button } from '@mantine/core';

import { SearchableSelect } from '~client/form/lib/searchable-select';
import * as hooks from '~zenstack/hooks';
import metadata from '~zenstack/hooks/__model_meta';
import * as schemas from '~zenstack/zod/models';
import { FieldType, type Metadata } from '~zenstack-ui/metadata';
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

// Customize metadata
const modifiedMetadata = metadata as Metadata;
modifiedMetadata.models.item!.fields!.id!.hidden = true;

export const zenstackUIConfig: ZenstackUIConfigType = {
	hooks: hooks,
	schemas: schemas,
	metadata: modifiedMetadata,
	elementMap: mapFieldTypeToElement,
	submitButtons: submitButtonMap,
};
