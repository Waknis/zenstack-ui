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

export interface ZenstackUIConfigType {
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
}

const ZenstackUIContext = createContext<ZenstackUIConfigType | null>(null);

export function useZenstackUIProvider() {
	const context = useContext(ZenstackUIContext);
	if (!context) {
		throw new Error('zenstack-ui components must be used within a ZenstackUIProvider');
	}
	return context;
}

interface ZenstackUIProviderProps {
	config: ZenstackUIConfigType
	children: React.ReactNode
}

export function ZenstackUIProvider(props: ZenstackUIProviderProps) {
	return (
		<ZenstackUIContext.Provider value={props.config}>
			{props.children}
		</ZenstackUIContext.Provider>
	);
}
