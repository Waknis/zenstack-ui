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

	// custom fields
	hidden?: boolean
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

export type UseFindUniqueHook<T> = (options?: any) => {
	data: T
};
