/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from '@mantine/form';
import { cloneElement, isValidElement, useCallback, useEffect, useMemo } from 'react';
import React from 'react';
import { ZodSchema } from 'zod';

import { Field, Metadata } from '../metadata';
import { useZenstackUIProvider, ZenStackUIOptions } from '../utils/provider';
import { applyOptionsOverrides, getModelFields } from '../utils/utils';
import { ZSCustomField, ZSFieldSlot } from './form';
import { ZSFormInputInternal, ZSFormInputProps } from './input';

export interface ZSFormRef {
	form: ReturnType<typeof useForm>
}

export interface ZSFormOverrideProps {
	onSubmit?: (values: any) => void // Do custom action after submission completes
	overrideSubmit?: (values: any) => Promise<void> // Override default submission behavior with custom server hook
	schemaOverride?: ZodSchema
	metadataOverride?: Metadata
	optionsOverride?: Partial<ZenStackUIOptions>
	formRef?: React.RefObject<ZSFormRef>
	onFormChange?: (values: any) => void
}

interface ZSSharedFormProps extends ZSFormOverrideProps {
	model: string
	children?: React.ReactNode
	className?: string
}

export interface ZSUpdateFormProps extends ZSSharedFormProps {
	id: number | string
	/** Called by the form when the id field is updated. Useful for updating the URL */
	onIdChanged?: (id: number | string) => void
}

export type ZSCreateFormProps = ZSSharedFormProps;

export type ZSFormType = 'create' | 'update';

export interface ZSBaseFormProps extends ZSSharedFormProps {
	form: ReturnType<typeof useForm>
	schema: ZodSchema
	type: ZSFormType

	// Loading states
	isLoadingInitialData?: boolean
	isLoadingUpdate?: boolean
	isLoadingCreate?: boolean
}

// --------------------------------------------------------------------------------
// Base Form (shared between create/update forms)
// --------------------------------------------------------------------------------

export const ZSBaseForm = (props: ZSBaseFormProps) => {
	// eslint-disable-next-line no-useless-assignment
	const { metadata: originalMetadata, submitButtons, options: originalOptions } = useZenstackUIProvider();
	const options = applyOptionsOverrides(originalOptions, props.optionsOverride);

	const metadata = props.metadataOverride || originalMetadata;
	const fields = getModelFields(metadata, props.model);

	// Memoize fields object
	const memoizedFields = useMemo(() => fields, [fields]);

	// Memoize the check for custom/placeholder fields
	const hasCustomOrPlaceholder = useCallback((fieldName: string, children: React.ReactNode): boolean => {
		return React.Children.toArray(children).some((child) => {
			if (!isValidElement(child)) return false;

			if (typeof child.type === 'function') {
				const displayName = (child.type as any).displayName;
				if (displayName === ZSCustomField.displayName && child.props.fieldName === fieldName) {
					return true;
				}
				if (displayName === ZSFieldSlot.displayName && child.props.fieldName === fieldName) {
					return true;
				}

				try {
					const renderedElement = (child.type as (props: any) => React.ReactNode)(child.props);
					return hasCustomOrPlaceholder(fieldName, renderedElement);
				} catch (error) {
					return false;
				}
			}

			return child.props.children ? hasCustomOrPlaceholder(fieldName, child.props.children) : false;
		});
	}, []);

	// Memoize the processChildren function
	const processChildren = useCallback((element: React.ReactNode): React.ReactNode => {
		if (!isValidElement(element)) return element;

		if (typeof element.type === 'function') {
			const displayName = (element.type as any).displayName;

			if (displayName === ZSCustomField.displayName) {
				const fieldName = element.props.fieldName;
				const field = memoizedFields[fieldName];
				const customElement = React.Children.only(element.props.children);

				if (!field) {
					console.warn(`Field ${fieldName} not found in model ${props.model}`);
					return element;
				}

				// Replace customElement with ZSFormInputInternal
				return (
					<ZSFormInputInternal
						key={fieldName}
						field={field}
						index={-1}
						customElement={customElement}
						{...props}
					/>
				);
			}

			if (displayName === ZSFieldSlot.displayName) {
				const fieldName = element.props.fieldName;
				const field = memoizedFields[fieldName];

				if (!field) {
					console.warn(`Field ${fieldName} not found in model ${props.model}`);
					return element;
				}

				// Replace ZSFieldSlot with ZSFormInputInternal
				return (
					<ZSFormInputInternal
						key={fieldName}
						field={field}
						index={-1}
						className={element.props.className}
						onChange={element.props.onChange}
						{...props}
					/>
				);
			}

			try {
				const renderedElement = (element.type as (props: any) => React.ReactNode)(element.props);
				return processChildren(renderedElement);
			} catch (error) {
				return element;
			}
		}

		if (element.props.children) {
			return cloneElement(element, {
				...element.props,
				children: React.Children.map(element.props.children, child => processChildren(child)),
			});
		}

		return element;
	}, [memoizedFields, props]);

	// Memoize error checking
	const hasErrors = useMemo(() => Object.keys(props.form.errors).length > 0, [props.form.errors]);

	// Memoize dirty state for update button
	const isDirty = useMemo(() => {
		return props.type === 'update' && Object.values(props.form.getDirty()).some(isDirty => isDirty);
	}, [props.type, props.form.getDirty()]);

	// Add effect to watch form values
	useEffect(() => {
		if (props.onFormChange) {
			props.onFormChange(props.form.values);
		}
	}, [props, props.form.values, props.onFormChange]);

	return (
		<>
			<AutomaticFormFields
				fields={memoizedFields}
				hasCustomOrPlaceholder={hasCustomOrPlaceholder}
				{...props}
			>
				{props.children}
			</AutomaticFormFields>

			<UserDefinedFields processChildren={processChildren}>
				{props.children}
			</UserDefinedFields>

			{options.showErrorMessage && hasErrors && (
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

			{options.showSubmitButton && props.type === 'create' && (
				<submitButtons.create
					model={props.model}
					type="submit"
					loading={props.isLoadingCreate}
				/>
			)}
			{options.showUpdateButton && props.type === 'update' && (
				<submitButtons.update
					model={props.model}
					type="submit"
					disabled={!isDirty}
					loading={props.isLoadingUpdate}
				/>
			)}
		</>
	);
};

// --------------------------------------------------------------------------------
// Memoized components
// Results of automatic fields and custom fields are memoized to avoid re-renders on every form update
// Internal use only
// --------------------------------------------------------------------------------

// Rename to better describe the purpose
type AutomaticFormFieldsProps = {
	fields: Record<string, Field>
	hasCustomOrPlaceholder: (fieldName: string, children: React.ReactNode) => boolean
	children: React.ReactNode
} & Omit<ZSFormInputProps, 'field' | 'index' | 'customElement' | 'className'>;

const AutomaticFormFields = React.memo(({ fields, hasCustomOrPlaceholder, children, ...props }: AutomaticFormFieldsProps) => {
	const { options: originalOptions } = useZenstackUIProvider();
	const options = applyOptionsOverrides(originalOptions, props.optionsOverride);

	// Sort fields by order, respecting showOrderedFieldsFirst option
	const sortedFields = Object.values(fields).sort((a, b) => {
		// If both have order, compare them
		if (a.order !== undefined && b.order !== undefined) {
			return a.order - b.order;
		}
		// If only one has order, use showOrderedFieldsFirst to determine order
		if (a.order !== undefined || b.order !== undefined) {
			const orderedFirst = options.showOrderedFieldsFirst ? -1 : 1;
			return a.order !== undefined ? orderedFirst : -orderedFirst;
		}
		// If neither has order, maintain original order
		return 0;
	});

	return (
		<>
			{sortedFields.map((field, index) => {
				if (hasCustomOrPlaceholder(field.name, children)) return null;
				return (
					<ZSFormInputInternal
						key={field.name}
						field={field}
						index={index}
						{...props}
					/>
				);
			})}
		</>
	);
});
AutomaticFormFields.displayName = 'AutomaticFormFields';

interface UserDefinedFieldsProps {
	children: React.ReactNode
	processChildren: (element: React.ReactNode) => React.ReactNode
}

const UserDefinedFields = React.memo(({ children, processChildren }: UserDefinedFieldsProps) => {
	return <>{React.Children.map(children, processChildren)}</>;
});
UserDefinedFields.displayName = 'UserDefinedFields';
