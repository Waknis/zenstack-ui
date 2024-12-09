/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo } from 'react';
import { z } from 'zod';

import { Field, FieldType, UseQueryHook } from '../metadata';
import { useZenstackUIProvider, ZenStackUIOptions } from '../utils/provider';
import { applyOptionsOverrides, getIdField, getModelFields } from '../utils/utils';
import { ZSBaseFormProps, ZSFormOverrideProps } from './base';

// --------------------------------------------------------------------------------
// Form component that generates the matching form input component
// Internal use only
// --------------------------------------------------------------------------------

export interface ZSFormInputProps extends ZSBaseFormProps {
	field: Field
	index: number
	customElement?: React.ReactElement
	onChange?: (event: any) => void
}

/**
 * Internal use only - component that generates the matching form input component
 */
export const ZSFormInputInternal = React.memo((props: ZSFormInputProps) => {
	const { metadata: originalMetadata, elementMap, hooks, enumLabelTransformer, options: originalOptions } = useZenstackUIProvider();
	const metadata = props.metadataOverride || originalMetadata;
	const options = applyOptionsOverrides(originalOptions, props.optionsOverride);
	const fields = getModelFields(metadata, props.model);

	// Get the underlying schema shape, handling both regular objects and effects
	const zodShape = useMemo(() => {
		const getSchemaShape = (schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> => {
			if ('shape' in schema) {
				return schema.shape as Record<string, z.ZodTypeAny>;
			}

			// Handle effects by getting their inner type
			if ('schema' in schema._def) {
				return getSchemaShape(schema._def.schema);
			}

			console.error('Unable to extract shape from schema:', schema);
			return {};
		};

		return getSchemaShape(props.schema);
	}, [props.schema]);

	const field = props.field;

	// Get the hook function unconditionally
	const useQueryDataHook = useMemo(() => {
		if (!field.isForeignKey) return null;
		const dataModelField = fields[field.relationField!];
		return hooks[`useFindMany${dataModelField.type}`] as UseQueryHook<any>;
	}, [field.isForeignKey, field.relationField, fields, hooks]);

	// Call the hook unconditionally (if it exists)
	// eslint-disable-next-line react-hooks/rules-of-hooks
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
			labelData = [{ label: options.loadingPlaceholder, value: options.loadingPlaceholder }];
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
		const errorString = `No element mapping found for field ${fieldName} with type: ${field.type}`;
		console.error(errorString);
		return <div style={{ color: 'red' }} key={fieldName}>{errorString}</div>;
	}

	let placeholder = field.placeholder;
	if (props.isLoadingInitialData) placeholder = options.loadingPlaceholder;

	// Create wrapped onChange handler
	// This handler is used to reset dependent fields when the main field changes (using dependsOn from metadata)
	const handleChange = (event: any) => {
		const fieldName = props.field.name;

		// Call custom element's onChange if it exists
		if (props.customElement?.props.onChange) props.customElement.props.onChange(event);
		// Call ZSFieldSlot's onChange if it exists
		if (props.onChange) props.onChange(event);

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

	// Get form props based on field type
	// Mantine requires special handling for boolean fields
	const getFormProps = () => {
		if (fieldType === FieldType.Boolean) {
			return {
				...props.form.getInputProps(fieldName, { type: 'checkbox' }),
				required: false,
			};
		}
		return props.form.getInputProps(fieldName);
	};

	// If we have a custom element, use it instead of the element mapping
	if (props.customElement) {
		const originalClassName = props.customElement.props.className || '';
		const dirtyClassName = isDirty ? 'dirty' : '';
		const combinedClassName = `${originalClassName} ${dirtyClassName}`.trim();

		// Create base props that we want to pass
		const baseProps = {
			...getFormProps(), // Use getFormProps instead of direct getInputProps
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

		// Filter out props that are already defined in customElement, BUT preserve className
		const finalProps = Object.fromEntries(
			Object.entries(baseProps).filter(([key]) => {
				if (key === 'onChange') return true; // Don't override onChange
				if (key === 'className') return true; // Always include className
				return props.customElement!.props[key] === undefined;
			}),
		);
		// For custom elements, we need to prioritize the loading placeholder
		if (props.isLoadingInitialData) finalProps.placeholder = options.loadingPlaceholder;

		return React.cloneElement(props.customElement, finalProps);
	}

	return (
		<Element
			placeholder={placeholder}
			required={required}
			key={props.form.key(fieldName)}
			{...getFormProps()} // Use getFormProps instead of direct getInputProps
			onChange={handleChange}
			label={label}
			data={labelData}
			className={`${props.className || ''} ${isDirty ? 'dirty' : ''}`.trim()}
			disabled={isDisabled}
			data-autofocus={props.index === 0}
		/>
	);
});
ZSFormInputInternal.displayName = 'ZSFormInputInternal';
