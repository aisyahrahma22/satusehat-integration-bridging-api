import { boolean, object, string, TypeOf } from 'zod';

// Define schema for common parameters
const paramsSchema = object({
  hospitalId: string().nonempty('Hospital ID is required'),
});

// Define schema for payload
const payloadSchema = object({
  name: string().nonempty('Organization name is required'),
  type: string().nonempty('Organization type is required'),
  address: string().nonempty('Organization address is required'),
  phone: string().nonempty('Organization phone is required'),
  active: boolean().optional(),
});

// Export schemas
export const getFhirOrganizationSchema = paramsSchema;

export const setFhirOrganizationSchema = paramsSchema.merge(payloadSchema);

// Export types
export type GetFhirOrganizationInput = TypeOf<typeof getFhirOrganizationSchema>;
export type SetFhirOrganizationInput = TypeOf<typeof setFhirOrganizationSchema>;
