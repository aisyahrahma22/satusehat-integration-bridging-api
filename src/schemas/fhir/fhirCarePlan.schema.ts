import { boolean, object, string, TypeOf } from 'zod';

// Define schema for params
const paramsSchema = object({
  hospitalId: string().nonempty('Hospital ID is required'),
  registrationId: string().nonempty('Registration ID is required'),
});

// Define schema for payload
const payloadSchema = object({
  procedureName: string().optional(),
  notes: string().optional(),
  createdAt: string().optional(),
  active: boolean().optional(),
  procedureUuid: string().optional(),
});

// Export schemas
export const getFhirCarePlanSchema = paramsSchema;

export const setFhirCarePlanSchema = paramsSchema.merge(payloadSchema);

// Export types
export type GetFhirCarePlanInput = TypeOf<typeof getFhirCarePlanSchema>;
export type SetFhirCarePlanInput = TypeOf<typeof setFhirCarePlanSchema>;
