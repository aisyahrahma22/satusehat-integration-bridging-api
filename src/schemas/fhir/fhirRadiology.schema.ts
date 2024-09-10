import { boolean, object, string, TypeOf, array, any } from 'zod';

// Define schema for common parameters
const paramsSchema = object({
  registrationId: string().nonempty('Registration ID is required'),
  hospitalId: string().nonempty('Hospital ID is required'),
});

// Define schema for payload
const payloadSchema = object({
  registrationId: string().nonempty('Registration ID is required'),
  hospitalId: string().nonempty('Hospital ID is required'),
  item: array(object({
    loincName: string().optional(),
    uuid: string().optional(),
    loincCode: string().optional(),
    createdAt: any().optional(),
    specimenName: string().optional(),
    specimenCode: string().optional(),
    category: string().optional(),
    type: string().optional(),
    active: string().optional(),
  })).optional(),
});

// Export schemas
export const getFhirRadiologySchema = paramsSchema;

export const setFhirRadiologySchema = paramsSchema.merge(payloadSchema);

// Export types
export type GetFhirRadiologyInput = TypeOf<typeof getFhirRadiologySchema>;
export type SetFhirRadiologyInput = TypeOf<typeof setFhirRadiologySchema>;
