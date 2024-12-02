import { z } from 'zod';

import { HouseRoomCreateSchema, HouseRoomSchema } from '~zenstack/zod/models';

/** During an update, the form sends empty strings when you try to delete a text field's content. This converts them to nulls. */
export const emptyStringToNull = () =>
	z.preprocess((val) => {
		if (val === '') return null;
		return val;
	}, z.string().optional().nullable()).optional();

// Override the create schema to omit the aiSummary field
export const CustomRoomCreateSchema = HouseRoomCreateSchema
	.omit({ aiSummary: true })
	.extend({ description: emptyStringToNull() });

// Example issue - we set a minimum length of 1 character for the description
// However, if you try to delete the description, even thougho it's optional, it will give a zod error because it sees '' instead of null
// This preprocessor converts '' to null, so we don't get an error
export const CustomRoomUpdateSchema = HouseRoomSchema
	.extend({ description: emptyStringToNull() })
	.refine(data => !data.description || data.description.length >= 1, {
		message: 'Description must be at least 1 character',
		path: ['description'],
	});
