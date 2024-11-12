/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from '@mantine/form';
import { getHotkeyHandler } from '@mantine/hooks';
import { zodResolver } from 'mantine-form-zod-resolver';
import { useEffect } from 'react';
import { z } from 'zod';

import { Field, FieldType, UseFindUniqueHook, UseMutationHook, UseQueryHook } from '../metadata';
import { useZenstackUIProvider } from '../utils/provider';
import { getIdField, getModelFields } from '../utils/utils';

interface ZenstackSharedFormProps {
	model: string
}

interface ZenstackUpdateFormProps extends ZenstackSharedFormProps {
	id: number | string
	onSubmit?: (values: any) => void
	onLoadStateChanged?: (loading: boolean) => void
	onIdChanged?: (id: number | string) => void
}

interface ZenstackCreateFormProps extends ZenstackSharedFormProps {
	onSubmit?: (values: any) => void
}

interface ZenstackBaseFormProps extends ZenstackSharedFormProps {
	form: ReturnType<typeof useForm>
	schema: z.ZodObject<any>
	type: 'create' | 'update'
}

const resetForm = (form: ReturnType<typeof useForm>, data?: any) => {
	form.setInitialValues(data || {});
	form.setValues(data || {});
	form.resetDirty();
};

/**
 * Cleans and connects data for foreign key fields
 * @param data - Data to clean
 * @param fields - Fields for the model
 * @returns Cleaned data
 * Example: { ownerName: 'John Doe', name: 'Item 1' } -> { owner: { connect: { name: 'John Doe' } }, name: 'Item 1' }
 */
const cleanAndConnectData = (data: Record<string, unknown>, fields: Record<string, Field>) => {
	// Create a clean copy of data
	const cleanData = { ...data };
	const connectorData: Record<string, unknown> = {};

	// Iterate through foreign key fields
	Object.values(fields).forEach((field) => {
		if (!field.isForeignKey) return;
		const relationField = fields[field.relationField!];
		const relationIdKey = Object.keys(relationField.foreignKeyMapping!)[0];
		const relationValue = cleanData[field.name];

		// If value exists, create connect object for the relation
		if (!relationValue) return;
		connectorData[field.relationField!] = {
			connect: {
				[relationIdKey]: relationValue,
			},
		};

		// Remove the foreign key field from clean data
		delete cleanData[field.name];
	});

	return { ...cleanData, ...connectorData };
};

/**
 * Captures currently focused element and returns a function to restore focus to it
 * @returns Function that restores focus to the previously active element
 */
const focusOnPrevActiveElement = () => {
	const activeElement = document.activeElement as HTMLElement;
	const dataPath = activeElement?.getAttribute('data-path');

	return () => {
		setTimeout(() => {
			const elementToFocus = document.querySelector(`[data-path="${dataPath}"]`) as HTMLElement;
			elementToFocus?.focus();
		}, 0);
	};
};

// --------------------------------------------------------------------------------
// Update Form
// TODO: There is a bug where if the data loads before a reference field list is ready, then the select field will display empty until clicked. Ex: data loads with owner Kiran, but the list of owners is not ready yet. form tries to set the value to Kiran, but the list is empty so it shows empty. Temp fix as been implemented by checking for reference field list data in both Update and Base Form.
// --------------------------------------------------------------------------------
export const ZenstackUpdateForm = (props: ZenstackUpdateFormProps) => {
	const { schemas, metadata, hooks } = useZenstackUIProvider();

	// Extract information
	const mainSchema = schemas[`${props.model}Schema`]; // we don't use update schema because that will mark everything as optional
	const fields = getModelFields(metadata, props.model);
	const idField = getIdField(fields);

	// Fetch initial values
	const useFindUniqueHook = hooks[`useFindUnique${props.model}`] as UseFindUniqueHook<any>;
	const { data } = useFindUniqueHook({ where: { [idField.name]: props.id } });

	// Setup update hook
	const useUpdateHook = hooks[`useUpdate${props.model}`] as UseMutationHook<any>;
	const update = useUpdateHook({ optimisticUpdate: true });

	// Fetch reference field values
	// This is already being done in the base form, but doing it here again to trigger a re-render when the data is loaded
	const referenceFields = Object.values(fields).filter(field => field.isDataModel);
	const referenceQueries = referenceFields.map((field) => {
		const useQueryDataHook = hooks[`useFindMany${field.type}`] as UseQueryHook<any>;
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useQueryDataHook();
	});
	const allReferencesLoaded = referenceQueries.every(query => query?.data);

	// This fixes the race condition bug by setting the form data again after references are loaded.
	// Ideally, each field should be updated on it's own
	useEffect(() => {
		console.log('allReferencesLoaded:', allReferencesLoaded);
		if (allReferencesLoaded) {
			form.setValues(data || {});
		}
	}, [allReferencesLoaded]);

	// Setup form
	const form = useForm({
		mode: 'uncontrolled',
		validate: zodResolver(mainSchema),
		initialValues: data || {},
		// validateInputOnBlur: true,
	});

	// When the id changes, set all values to null. Setting to empty object doesn't work
	useEffect(() => {
		const emptyValues = Object.keys(fields).reduce((acc, key) => {
			// Skip isDataModel fields
			if (fields[key].isDataModel) return acc;
			acc[key] = null;
			return acc;
		}, {} as Record<string, null>);
		form.setValues(emptyValues);
	}, [props.id]);

	// Set initial values after data is fetched
	useEffect(() => {
		if (data) {
			props.onLoadStateChanged?.(false);
			resetForm(form, data);
		} else {
			props.onLoadStateChanged?.(true);
		}
	}, [data]);

	// Handle update submit
	const handleUpdateSubmit = async (values: any) => {
		// Only send dirty fields for the update query
		const dirtyFields = form.getDirty();
		const dirtyValues = Object.fromEntries(
			Object.entries(values as Record<string, unknown>)
				.filter(([key]) => dirtyFields[key]),
		);
		// Update data
		const cleanedData = cleanAndConnectData(dirtyValues, fields);
		try {
			// perform update query
			const result = await update.mutateAsync({
				where: { [idField.name]: props.id },
				data: cleanedData,
			});

			// Check if ID field was updated and trigger callbacks
			if (dirtyFields[idField.name]) props.onIdChanged?.(result[idField.name]);
			props.onSubmit?.(cleanedData);
		} catch (error) {
			console.error('Update failed:', error);
		}
	};

	// Reverts form to initial values and focuses on the last edited element
	const handleRevertShortcut = () => {
		const focus = focusOnPrevActiveElement();
		form.reset();
		focus();
	};

	return (
		<form
			onSubmit={form.onSubmit(handleUpdateSubmit)}
			onKeyDown={getHotkeyHandler([
				['meta+s', form.onSubmit(handleUpdateSubmit)],
				['mod+backspace', handleRevertShortcut],
			])}
		>
			<ZenstackBaseForm model={props.model} form={form} schema={mainSchema} type="update" />
		</form>
	);
};

// --------------------------------------------------------------------------------
// Create Form
// --------------------------------------------------------------------------------
export const ZenstackCreateForm = (props: ZenstackCreateFormProps) => {
	const { hooks, schemas, metadata } = useZenstackUIProvider();

	// Extract information
	const createSchema = schemas[`${props.model}CreateSchema`];
	const fields = getModelFields(metadata, props.model);

	// Get default values from metadata
	const defaultValueMap: Record<string, any> = {};
	Object.values(fields).forEach((field) => {
		const defaultAttr = field.attributes?.find(attr => attr.name === '@default');
		if (defaultAttr?.args?.[0]?.value) {
			defaultValueMap[field.name] = defaultAttr?.args?.[0]?.value;
		}
	});

	// Setup create hook
	const useCreateHook = hooks[`useCreate${props.model}`] as UseMutationHook<any>;
	const create = useCreateHook({ optimisticUpdate: true });

	// Setup form
	const form = useForm({
		mode: 'uncontrolled',
		validate: zodResolver(createSchema),
		initialValues: defaultValueMap,
		// validateInputOnBlur: true,
	});

	// Handle create submit
	const handleCreateSubmit = (values: any) => {
		const cleanedData = cleanAndConnectData(values, fields);
		create.mutateAsync({
			data: cleanedData,
		});
		props.onSubmit?.(cleanedData);
	};

	return (
		<form onSubmit={form.onSubmit(handleCreateSubmit)}>
			<ZenstackBaseForm model={props.model} form={form} schema={createSchema} type="create" />
		</form>
	);
};

// --------------------------------------------------------------------------------
// Base Form (shared between create/update forms)
// --------------------------------------------------------------------------------
const ZenstackBaseForm = (props: ZenstackBaseFormProps) => {
	console.log('rendering ZenstackBaseForm, type:', props.type);

	// eslint-disable-next-line no-useless-assignment
	const { metadata, elementMap, hooks, submitButtons } = useZenstackUIProvider();

	// Extract information
	const fields = getModelFields(metadata, props.model);
	const zodShape = props.schema.shape;

	// Fetch reference field values
	const listDataForReferenceFields: Record<string, { data: any[] }> = {};
	Object.values(fields).forEach((field) => {
		if (field.isDataModel) {
			const useQueryDataHook = hooks[`useFindMany${field.type}`] as UseQueryHook<any>;
			// eslint-disable-next-line react-hooks/rules-of-hooks
			listDataForReferenceFields[field.name] = useQueryDataHook();
		}
	});

	// Wait for reference data to be fetched
	const allQueriesFinished = Object.values(listDataForReferenceFields)
		.every(query => query?.data);
	console.log('allQueriesFinished:', allQueriesFinished);

	// if (!allQueriesFinished) return null;

	return (
		<>
			{Object.values(fields).map((field) => {
				// Skip hidden, foreign keys, array fields
				if (field.hidden) return null;
				if (field.isDataModel) return null;
				if (field.isArray) return null;

				// Define attributes
				let fieldType = field.type as FieldType;
				let fieldName = field.name;
				let labelData = {};
				let label = field.name;
				let zodDef = zodShape[fieldName]['_def'];
				let zodFieldType = zodDef['typeName'];

				// Check for optionals, and get inner type
				let required = true;
				if (zodFieldType === 'ZodOptional') {
					required = false;
					zodDef = zodDef['innerType']['_def'];
					zodFieldType = zodDef['typeName'];
				}

				// Update attributes depending on field type
				if (zodFieldType === 'ZodEnum') {
					// Enum type - Update attributes
					fieldType = FieldType.Enum;
					labelData = zodDef['values'].map((value: any) => {
						return {
							label: value,
							value: value,
						};
					});
				} else if (field.isForeignKey) {
					// Reference type - Update attributes
					fieldType = FieldType.ReferenceSingle;
					fieldName = field.name;
					label = field.relationField!;

					// Generate label data for relation
					const dataModelField = fields[field.relationField!];
					const relationFields = getModelFields(metadata, dataModelField.type);
					const relationIdField = getIdField(relationFields);

					if (listDataForReferenceFields[field.relationField!].data) {
						labelData = listDataForReferenceFields[field.relationField!].data.map((item: any) => {
							return {
								label: item[relationIdField.name!],
								value: item[relationIdField.name!],
							};
						});
					} else {
						labelData = [{ label: 'Loading...', value: 'Loading...' }];
					}
				}

				// Get the appropriate element from elementMap based on field type
				const Element = elementMap[fieldType];
				const isDirty = props.type === 'update' && props.form.getDirty()[fieldName];

				if (!Element) {
					// console.error(`No element mapping found for field type: ${field.type}`);
					return <div style={{ color: 'red' }} key={fieldName}>Error: No element mapping found for field type: {fieldType}</div>;
				}

				let placeholder;
				if (props.type === 'update') placeholder = 'Loading...';

				return (
					<Element
						placeholder={placeholder}
						required={required}
						key={props.form.key(fieldName)}
						label={label}
						data={labelData}
						className={isDirty ? 'dirty' : ''}
						{...props.form.getInputProps(fieldName)}
					/>
				);
			})}

			{/* Errors and Submit Buttons */}
			{Object.keys(props.form.errors).length > 0 && (
				<div style={{ flexShrink: 1 }}>
					<p
						style={{
							wordBreak: 'break-word',
							fontSize: '0.75rem',
							color: '#ef4444',
						}}
						title={JSON.stringify(props.form.errors)}
					>
						Errors: {JSON.stringify(props.form.errors)}
					</p>
				</div>
			)}

			{props.type === 'create' && <submitButtons.create model={props.model} type="submit" />}
			{props.type === 'update' && (
				<submitButtons.update
					model={props.model}
					type="submit"
					disabled={!Object.values(props.form.getDirty()).some(isDirty => isDirty)}
				/>
			)}
		</>
	);
};
