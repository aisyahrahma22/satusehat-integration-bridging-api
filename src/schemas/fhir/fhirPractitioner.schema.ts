import { boolean, object, string, TypeOf } from 'zod';

// Define schema for common parameters
const paramsSchema = object({
  hospitalId: string().nonempty('Hospital ID is required'),
  referenceId: string().nonempty('Reference ID is required'),
});

// Define schema for payload
const payloadSchema = object({
  source: string().nonempty('Source is required (doctor / nurse / user)'),
  identityNumber: string().nonempty('Identity number is required'),
  active: boolean().optional(),
});

// Export schemas
export const getFhirPractitionerSchema = paramsSchema;

export const setFhirPractitionerSchema = paramsSchema.merge(payloadSchema);

// Export types
export type GetFhirPractitionerInput = TypeOf<typeof getFhirPractitionerSchema>;
export type SetFhirPractitionerInput = TypeOf<typeof setFhirPractitionerSchema>;
