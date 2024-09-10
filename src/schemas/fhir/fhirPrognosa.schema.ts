import { boolean, object, string, TypeOf, array } from 'zod';

// Define schema for common parameters
const paramsSchema = object({
  hospitalId: string().nonempty('Hospital ID is required'),
  registrationId: string().nonempty('Registration ID is required'),
});

// Define schema for payload
const payloadSchema = object({
  name: string().optional(),
  code: string().optional(),
  notes: string().optional(),
  createdAt: string().optional(),
  active: boolean().optional(),
  pmrPrognosaId: string().nonempty('PMR Prognosa ID is required'),
});

// Export schemas
export const getFhirPrognosaSchema = paramsSchema;

export const setFhirPrognosaSchema = paramsSchema.merge(payloadSchema);

// Export types
export type GetFhirPrognosaInput = TypeOf<typeof getFhirPrognosaSchema>;
export type SetFhirPrognosaInput = TypeOf<typeof setFhirPrognosaSchema>;
