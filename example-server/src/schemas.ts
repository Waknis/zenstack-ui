import { RoomCreateSchema } from '~zenstack/zod/models';

// Override the create schema to omit the aiSummary field
export const CustomRoomCreateSchema = RoomCreateSchema.omit({ aiSummary: true });
