/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';
import { z } from 'zod';

import { FieldType, Metadata, UseQueryHook } from '../metadata';

// type Schema = z.ZodObject<any> | z.ZodEffects<any>;
type Schema = z.ZodObject<any>;

export type MapFieldTypeToElement = Partial<Record<FieldType | string, React.ElementType>>;

export interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	model: string
	loading?: boolean
}
export type SubmitType = 'create' | 'update';
export type MapSubmitTypeToButton = Record<SubmitType, React.ElementType<SubmitButtonProps>>;

export interface ZenStackUIOptions {
	/** Whether to show unordered fields first or last */
	showOrderedFieldsFirst: boolean
	/** Whether to hide the submit button */
	showSubmitButton: boolean
	/** Whether to hide the update button */
	showUpdateButton: boolean
	/** Whether to show error messages */
	showErrorMessage: boolean
	/** Loading placeholder text */
	loadingPlaceholder: string
}

/** Returns options with defaults */
const getDefaultOptions = ({
	showOrderedFieldsFirst = true,
	showSubmitButton = true,
	showUpdateButton = true,
	showErrorMessage = true,
	loadingPlaceholder = 'Loading...',
}: Partial<ZenStackUIOptions>): ZenStackUIOptions => ({ showOrderedFieldsFirst, showSubmitButton, showUpdateButton, showErrorMessage, loadingPlaceholder });

export interface ZSUIConfig {
	schemas: Record<string, Schema>
	metadata: Metadata
	elementMap: MapFieldTypeToElement
	submitButtons: MapSubmitTypeToButton
	hooks: Record<string, UseQueryHook<any> | any>
	queryClient: QueryClient

	/** Global className to be applied to all forms */
	globalClassName?: string

	/** Transform enum labels for display. For example, convert 'first_name' to 'First Name' */
	enumLabelTransformer?: (label: string) => string

	/** List of options */
	options: ZenStackUIOptions
}

/** The create type for use by the developer. This has options as optional since we create a default options object anyways. */
export interface ZenStackUIConfigCreate extends Omit<ZSUIConfig, 'options'> {
	options?: Partial<ZenStackUIOptions>
}

const ZenStackUIContext = createContext<ZSUIConfig | null>(null);

export function useZenstackUIProvider() {
	const context = useContext(ZenStackUIContext);
	if (!context) {
		throw new Error('zenstack-ui components must be used within a ZenstackUIProvider');
	}
	return context;
}

interface ZenStackUIProviderProps {
	config: ZenStackUIConfigCreate
	children: React.ReactNode
}

export function ZenStackUIProvider(props: ZenStackUIProviderProps) {
	const options = getDefaultOptions(props.config.options || {});
	return (
		<ZenStackUIContext.Provider value={{ ...props.config, options }}>
			{props.children}
		</ZenStackUIContext.Provider>
	);
}
