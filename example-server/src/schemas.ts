import { HouseRoomCreateSchema } from '~zenstack/zod/models';

// Override the create schema to omit the aiSummary field
export const CustomRoomCreateSchema = HouseRoomCreateSchema.omit({ aiSummary: true });
