import { boolean, object, string, TypeOf } from 'zod';

// Define schema for common parameters
const paramsSchema = object({
  hospitalId: string().nonempty('Hospital ID is required'),
  referenceId: string().nonempty('Reference ID is required'),
});

// Define schema for payload
const payloadSchema = object({
  source: string().nonempty('Location source is required'),
  code: string().optional(),
  name: string().nonempty('Location name is required'),
  description: string().optional(),
  partOfReferenceId: string().optional(),
  active: boolean().optional(),
});

// Export schemas
export const getFhirLocationSchema = paramsSchema;

export const setFhirLocationSchema = paramsSchema.merge(payloadSchema);

// Export types
export type GetFhirLocationInput = TypeOf<typeof getFhirLocationSchema>;
export type SetFhirLocationInput = TypeOf<typeof setFhirLocationSchema>;
