// Tanstack Router generic search params
export interface SearchParams {
	search: string | undefined
}
export const validateSearch = (search: SearchParams): SearchParams => ({ search: search.search || undefined });
