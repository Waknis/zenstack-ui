/* eslint-disable @typescript-eslint/no-explicit-any */

// ================================================================================
// __model_meta Types
// ================================================================================

export interface Attribute {
	name: string
	args: any[]
}

export enum FieldType {
	ReferenceSingle = 'ReferenceSingle',
	ReferenceMultiple = 'ReferenceMultiple',
	Enum = 'Enum',
	Boolean = 'Boolean',
	Int = 'Int',
	Float = 'Float',
	String = 'String',
	DateTime = 'DateTime',
	JSON = 'JSON',
}

export interface Field {
	name: string
	type: string
	isId?: boolean
	isAutoIncrement?: boolean
	isDataModel?: boolean
	isArray?: boolean
	backLink?: string
	isRelationOwner?: boolean
	foreignKeyMapping?: Record<string, string>
	isForeignKey?: boolean
	relationField?: string
	attributes?: Attribute[]
	isOptional?: boolean

	// custom fields for use by ZenstackForm
	/** The label to display for the field */
	label?: string
	placeholder?: string
	hidden?: boolean
	/** The field of the reference model to display in the reference picker */
	displayFieldForReferencePicker?: string
	dependsOn?: string[]
	filter?: (modelFields: any, referenceFields: any) => boolean
}

export interface UniqueConstraint {
	name: string
	fields: string[]
}

export interface Model {
	name: string
	fields: Record<string, Field>
	uniqueConstraints: Record<string, UniqueConstraint>
}

export interface Metadata {
	models: Record<string, Model>
	deleteCascade: Record<string, any>
}

// ================================================================================
// Hook Types
// ================================================================================

// Type for mutation hooks
export type UseMutationHook<T> = (options?: any) => {
	mutateAsync: (input: T) => Promise<any>
};

// Type for query hooks
export type UseQueryHook<T> = (options?: any) => {
	data: T[]
};

// Type for count hooks
export type UseCountHook<T> = (options?: any) => {
	data: number
};

export type UseFindUniqueHook<T> = (options?: any) => {
	data: T
	isLoading: boolean
};
