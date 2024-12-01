/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-useless-assignment */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from '@mantine/form';
import { getHotkeyHandler } from '@mantine/hooks';
import { zodResolver } from 'mantine-form-zod-resolver';
import { cloneElement, isValidElement, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import React from 'react';
import { z, ZodSchema } from 'zod';

import { Field, FieldType, Metadata, UseFindUniqueHook, UseMutationHook, UseQueryHook } from '../metadata';
import { useZenstackUIProvider } from '../utils/provider';
import { getIdField, getModelFields } from '../utils/utils';

const LOADING_PLACEHOLDER = 'Loading...';

// Form ref type
export interface ZenstackFormRef {
	form: ReturnType<typeof useForm>
}

export interface ZenstackFormOverrideProps {
	onSubmit?: (values: any) => void // Do custom action after submission completes
	overrideSubmit?: (values: any) => Promise<void> // Override default submission behavior with custom server hook
	schemaOverride?: ZodSchema
	metadataOverride?: Metadata
	formRef?: React.RefObject<ZenstackFormRef>
}

interface ZenstackSharedFormProps extends ZenstackFormOverrideProps {
	model: string
	children?: React.ReactNode
}

interface ZenstackUpdateFormProps extends ZenstackSharedFormProps {
	id: number | string
	/** Called by the form when the id field is updated. Useful for updating the URL */
	onIdChanged?: (id: number | string) => void
}

type ZenstackCreateFormProps = ZenstackSharedFormProps;

interface ZenstackBaseFormProps extends ZenstackSharedFormProps {
	form: ReturnType<typeof useForm>
	schema: ZodSchema
	type: 'create' | 'update'

	// Loading states
	isLoadingInitialData?: boolean
	isLoadingUpdate?: boolean
	isLoadingCreate?: boolean
}

/** Generates the default state for the form */
const createDefaultValues = (fields: Record<string, Field>) => {
	const defaultValueMap: Record<string, any> = {};
	Object.values(fields).forEach((field) => {
		if (field.isDataModel) return;
		const defaultAttr = field.attributes?.find(attr => attr.name === '@default');
		if (defaultAttr?.args?.[0]?.value) {
			defaultValueMap[field.name] = defaultAttr?.args?.[0]?.value;
		} else {
			defaultValueMap[field.name] = '';
		}
	});
	return defaultValueMap;
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
// --------------------------------------------------------------------------------
export const ZenstackUpdateForm = (props: ZenstackUpdateFormProps) => {
	const { hooks, schemas, metadata: originalMetadata, queryClient } = useZenstackUIProvider();
	const metadata = props.metadataOverride || originalMetadata;

	// Extract information
	const mainSchema = props.schemaOverride || schemas[`${props.model}Schema`]; // we don't use update schema because that will mark everything as optional
	const fields = getModelFields(metadata, props.model);
	const idField = getIdField(fields);

	// Fetch initial values
	const useFindUniqueHook = hooks[`useFindUnique${props.model}`] as UseFindUniqueHook<any>;
	const { data, isLoading: isLoadingInitialData } = useFindUniqueHook({ where: { [idField.name]: props.id } });

	// Setup update hook
	const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
	const useUpdateHook = hooks[`useUpdate${props.model}`] as UseMutationHook<any>;
	const update = useUpdateHook({ optimisticUpdate: true });

	// Setup form
	const form = useForm({
		mode: 'controlled', // Controlled mode is required for adaptive filters
		validate: zodResolver(mainSchema),
		initialValues: createDefaultValues(fields),
		// validateInputOnBlur: true,
	});

	// Add useImperativeHandle to expose form object
	useImperativeHandle(props.formRef, () => ({
		form,
	}));

	// When the id changes, reset back to an empty form first before the new query starts
	useEffect(() => {
		const defaultValues = createDefaultValues(fields);
		form.setInitialValues(defaultValues);
		form.setValues(defaultValues);
		form.resetDirty();
	}, [props.id]);

	// Set initial values after data is fetched
	useEffect(() => {
		if (data) {
			// Get default values, and copy over the new fetched data
			const defaultValues = createDefaultValues(fields);
			for (const key in data) {
				if (data[key]) defaultValues[key] = data[key];
			}

			form.setInitialValues(defaultValues);
			form.setValues(defaultValues);
			form.resetDirty();
		}
	}, [data]);

	// Handle update submit
	const handleUpdateSubmit = async (values: any) => {
		setIsLoadingUpdate(true);
		try {
			if (props.overrideSubmit) {
				await props.overrideSubmit(values);
				props.onSubmit?.(values);
				// Invalidate all queries for this model
				queryClient.invalidateQueries({
					predicate: (query) => {
						const queryKey = query.queryKey;
						return queryKey.includes(props.model);
					},
				});
			} else {
				// Only send dirty fields for the update query
				const dirtyFields = form.getDirty();
				const dirtyValues = Object.fromEntries(
					Object.entries(values as Record<string, unknown>)
						.filter(([key]) => dirtyFields[key]),
				);
				// Update data
				const cleanedData = cleanAndConnectData(dirtyValues, fields);
				const result = await update.mutateAsync({
					where: { [idField.name]: props.id },
					data: cleanedData,
				});

				// Check if ID field was updated and trigger callbacks
				if (dirtyFields[idField.name]) props.onIdChanged?.(result[idField.name]);
				props.onSubmit?.(cleanedData);
			}
		} catch (error) {
			console.error('Update failed:', error);
		} finally {
			setIsLoadingUpdate(false);
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
			<ZenstackBaseForm model={props.model} form={form} schema={mainSchema} type="update" isLoadingInitialData={isLoadingInitialData} isLoadingUpdate={isLoadingUpdate} metadataOverride={props.metadataOverride}>
				{props.children}
			</ZenstackBaseForm>
		</form>
	);
};

// --------------------------------------------------------------------------------
// Create Form
// --------------------------------------------------------------------------------
export const ZenstackCreateForm = (props: ZenstackCreateFormProps) => {
	const { hooks, schemas, metadata: originalMetadata, queryClient } = useZenstackUIProvider();
	const metadata = props.metadataOverride || originalMetadata;

	// Extract information
	const createSchema: ZodSchema = props.schemaOverride || schemas[`${props.model}CreateSchema`];
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
	const [isLoadingCreate, setIsLoadingCreate] = useState(false);
	const useCreateHook = hooks[`useCreate${props.model}`] as UseMutationHook<any>;
	const create = useCreateHook({ optimisticUpdate: true });

	// Setup form
	const form = useForm({
		mode: 'controlled', // Controlled mode is required for adaptive filters
		validate: zodResolver(createSchema),
		initialValues: defaultValueMap,
		// validateInputOnBlur: true,
	});

	// Add useImperativeHandle to expose form object
	useImperativeHandle(props.formRef, () => ({
		form,
	}));

	// Handle create submit
	const handleCreateSubmit = async (values: any) => {
		setIsLoadingCreate(true);
		try {
			if (props.overrideSubmit) {
				await props.overrideSubmit(values);
				props.onSubmit?.(values);

				// Invalidate all queries for this model
				queryClient.invalidateQueries({
					predicate: (query) => {
						const queryKey = query.queryKey;
						return queryKey.includes(props.model);
					},
				});
			} else {
				const cleanedData = cleanAndConnectData(values, fields);
				await create.mutateAsync({
					data: cleanedData,
				});
				props.onSubmit?.(cleanedData);
			}
		} catch (error) {
			console.error('Create failed:', error);
		} finally {
			setIsLoadingCreate(false);
		}
	};

	return (
		<form onSubmit={form.onSubmit(handleCreateSubmit)}>
			<ZenstackBaseForm model={props.model} form={form} schema={createSchema} type="create" isLoadingCreate={isLoadingCreate} metadataOverride={props.metadataOverride}>
				{props.children}
			</ZenstackBaseForm>
		</form>
	);
};

// --------------------------------------------------------------------------------
// Base Form (shared between create/update forms)
// --------------------------------------------------------------------------------
const ZenstackBaseForm = (props: ZenstackBaseFormProps) => {
	const { metadata: originalMetadata, submitButtons } = useZenstackUIProvider();
	const metadata = props.metadataOverride || originalMetadata;
	const fields = getModelFields(metadata, props.model);

	// Helper function to recursively process children
	const processChildren = (element: React.ReactNode): React.ReactNode => {
		if (!isValidElement(element)) return element;

		// Handle custom elements with data-field-name
		if (element.props['data-field-name']) {
			const fieldName = element.props['data-field-name'];
			const field = fields[fieldName];

			if (!field) {
				console.warn(`Field ${fieldName} not found in model ${props.model}`);
				return element;
			}

			return (
				<ZenstackFormInputInternal
					key={fieldName}
					field={field}
					index={-1}
					{...props}
					customElement={element}
				/>
			);
		}

		// Handle placeholder elements (data-placeholder-name)
		if (element.props['data-placeholder-name']) {
			const fieldName = element.props['data-placeholder-name'];
			console.log('found placeholder', fieldName);
			const field = fields[fieldName];

			if (!field) {
				console.warn(`Field ${fieldName} not found in model ${props.model}`);
				return element;
			}

			return (
				<ZenstackFormInputInternal
					key={fieldName}
					field={field}
					index={-1}
					className={element.props.className}
					{...props}
				/>
			);
		}

		// If element has children, clone it and process its children
		if (element.props.children) {
			return cloneElement(element, {
				...element.props,
				children: React.Children.map(element.props.children, processChildren),
			});
		}

		return element;
	};

	// Helper to check if a field has either a custom element or placeholder
	const hasCustomOrPlaceholder = (fieldName: string) => {
		return React.Children.toArray(props.children).some(
			child => isValidElement(child) && (
				child.props['data-field-name'] === fieldName
				|| child.props['data-placeholder-name'] === fieldName
				// Also check nested children
				|| (child.props.children && React.Children.toArray(child.props.children).some(
					nestedChild => isValidElement(nestedChild) && (
						nestedChild.props['data-field-name'] === fieldName
						|| nestedChild.props['data-placeholder-name'] === fieldName
					),
				))
			),
		);
	};

	return (
		<>
			{/* Render default form fields that don't have custom elements or placeholders */}
			{Object.values(fields).map((field, index) => {
				if (hasCustomOrPlaceholder(field.name)) return null;

				return (
					<ZenstackFormInputInternal
						key={field.name}
						field={field}
						index={index}
						{...props}
					/>
				);
			})}

			{/* Render custom elements and placeholders */}
			{React.Children.map(props.children, processChildren)}

			{/* Existing error and submit button rendering */}
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

			{props.type === 'create' && (
				<submitButtons.create
					model={props.model}
					type="submit"
					loading={props.isLoadingCreate}
				/>
			)}
			{props.type === 'update' && (
				<submitButtons.update
					model={props.model}
					type="submit"
					disabled={!Object.values(props.form.getDirty()).some(isDirty => isDirty)}
					loading={props.isLoadingUpdate}
				/>
			)}
		</>
	);
};

interface ZenstackFormInputProps extends ZenstackBaseFormProps {
	field: Field
	index: number
	customElement?: React.ReactElement
	className?: string
}
const ZenstackFormInputInternal = (props: ZenstackFormInputProps) => {
	const { metadata: originalMetadata, elementMap, hooks, enumLabelTransformer } = useZenstackUIProvider();
	const metadata = props.metadataOverride || originalMetadata;

	const fields = getModelFields(metadata, props.model);
	const zodShape = ('shape' in props.schema ? props.schema.shape : {}) as Record<string, z.ZodTypeAny>;
	const field = props.field;

	// Get the hook function unconditionally
	const useQueryDataHook = useMemo(() => {
		if (!field.isForeignKey) return null;
		const dataModelField = fields[field.relationField!];
		return hooks[`useFindMany${dataModelField.type}`] as UseQueryHook<any>;
	}, [field.isForeignKey, field.relationField, fields, hooks]);

	// Call the hook unconditionally (if it exists)
	const referenceFieldData = useQueryDataHook ? useQueryDataHook() : { data: null };

	// Skip hidden, foreign keys, array fields
	if (field.hidden) return null;
	if (field.isDataModel) return null;
	if (field.isArray) return null;

	// Define attributes
	let fieldType = field.type as FieldType;
	let fieldName = field.name;
	let labelData = {};
	let label = field.label || field.name;
	let zodDef = zodShape[fieldName]?._def;
	let zodFieldType = zodDef?.typeName;

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

		// Generate base enum values
		let enumValues = zodDef['values'].map((value: any) => ({
			label: enumLabelTransformer ? enumLabelTransformer(value) : value,
			value: value,
		}));

		// Filter the enum values if a filter function exists
		if (field.filter) {
			const modelValues = props.form.getValues();
			// Fix an issue where values are strings ('undefined') instead of undefined
			Object.keys(modelValues).forEach(key => modelValues[key] === 'undefined' && (modelValues[key] = undefined));
			// Filter the enum values
			enumValues = enumValues.filter((enumItem: any) => field.filter!(modelValues, { value: enumItem.value }));
		}

		labelData = enumValues;
	} else if (field.isForeignKey) {
		// Reference type - Update attributes
		fieldType = FieldType.ReferenceSingle;
		fieldName = field.name;
		label = field.relationField!;

		// Generate label data for relation
		const dataModelField = fields[field.relationField!];
		const relationFields = getModelFields(metadata, dataModelField.type);
		const relationIdField = getIdField(relationFields);

		if (referenceFieldData?.data) {
			// Find the display field for the reference model
			// If displayFieldForReferencePicker exists, use it instead of the default id field
			const backlinkField = getModelFields(metadata, dataModelField.type);
			const backlinkIdField = getIdField(backlinkField);
			const displayField = backlinkIdField.displayFieldForReferencePicker || relationIdField.name;

			// Filter the data if a filter function exists
			let filteredData = referenceFieldData.data;
			if (field.filter) {
				const modelValues = props.form.getValues();
				// Fix an issue where values are strings ('undefined') instead of undefined
				Object.keys(modelValues).forEach(key => modelValues[key] === 'undefined' && (modelValues[key] = undefined));
				// Filter the data
				filteredData = referenceFieldData.data.filter((referenceItem: any) => field.filter!(modelValues, referenceItem));
			}

			// Generate label data
			labelData = filteredData.map((item: any) => {
				return {
					label: `${item[displayField]}`,
					value: item[relationIdField.name!],
				};
			});
		} else {
			labelData = [{ label: LOADING_PLACEHOLDER, value: LOADING_PLACEHOLDER }];
		}
	}

	// Get the appropriate element from elementMap based on field type
	const Element = elementMap[fieldType];
	const isDirty = props.type === 'update' && props.form.getDirty()[fieldName];

	// Check if field should be disabled based on dependencies
	let isDisabled = false;
	if (field.dependsOn) {
		const formValues = props.form.getValues();
		isDisabled = field.dependsOn.some(dependencyField =>
			formValues[dependencyField] === undefined
			|| formValues[dependencyField] === null,
		);
	}

	if (!Element) {
		console.error(`No element mapping found for field type: ${field.type}`);
		return <div style={{ color: 'red' }} key={fieldName}>Error: No element mapping found for field type: {fieldType}</div>;
	}

	let placeholder = field.placeholder;
	if (props.isLoadingInitialData) placeholder = LOADING_PLACEHOLDER;

	// Create wrapped onChange handler
	// This handler is used to reset dependent fields when the main field changes (using dependsOn from metadata)
	const handleChange = (event: any) => {
		const fieldName = props.field.name;

		// Call custom element's onChange if it exists
		if (props.customElement?.props.onChange) props.customElement.props.onChange(event);

		// Call original onChange
		props.form.getInputProps(fieldName).onChange(event);

		// Find fields that depend on this field
		Object.values(fields).forEach((field) => {
			if (!field.dependsOn?.includes(fieldName)) return;

			// Get default value for the dependent field if it exists
			const defaultAttr = field.attributes?.find(attr => attr.name === '@default');
			const defaultValue = defaultAttr?.args?.[0]?.value ?? null;

			// Reset the dependent field to default or null
			props.form.setFieldValue(field.name, defaultValue);
		});
	};

	// If we have a custom element, use it instead of the element mapping
	if (props.customElement) {
		const originalClassName = props.customElement.props.className || '';
		const dirtyClassName = isDirty ? 'dirty' : '';
		const combinedClassName = `${originalClassName} ${dirtyClassName}`.trim();

		// Create base props that we want to pass
		const baseProps = {
			...props.form.getInputProps(fieldName),
			'onChange': handleChange,
			required,
			'key': props.form.key(fieldName),
			'className': combinedClassName,
			'disabled': isDisabled,
			'placeholder': placeholder,
			label,
			'data': labelData,
			'data-autofocus': props.index === 0,
		};

		// Filter out props that are already defined in customElement
		const finalProps = Object.fromEntries(
			Object.entries(baseProps).filter(([key]) => {
				if (key === 'onChange') return true; // Don't override onChange
				return props.customElement!.props[key] === undefined;
			}),
		);
		// For custom elements, we need to prioritize the loading placeholder
		if (props.isLoadingInitialData) finalProps.placeholder = LOADING_PLACEHOLDER;

		return React.cloneElement(props.customElement, finalProps);
	}

	return (
		<Element
			placeholder={placeholder}
			required={required}
			key={props.form.key(fieldName)}
			{...props.form.getInputProps(fieldName)}
			onChange={handleChange} // Override onChange with our wrapped version
			label={label}
			data={labelData}
			className={`${props.className || ''} ${isDirty ? 'dirty' : ''}`.trim()}
			disabled={isDisabled}
			data-autofocus={props.index === 0}
		/>
	);
};
