import { boolean, number, object, string, TypeOf } from 'zod';

// Define schema for common parameters
const paramsSchema = object({
  hospitalId: string().nonempty('Hospital ID is required'),
  patientId: string().nonempty('Patient ID is required'),
});

// Define schema for payload
const payloadSchema = object({
  identityNumber: string().nonempty('Identity number is required'),
  active: boolean().optional(),
  consent: object({
    agent: string().nonempty('Agent is required'),
    action: string().nonempty('Action is required'),
  }).optional(),
  isBaby: boolean().optional(),
  dataBaby: object({
    identityType: string().nullable(),
    gender: string().nullable(),
    name: string().nullable(),
    dob: string().nullable(),
    birthOrder: number().nullable(),
  }).nullable().optional(),
});

// Export schemas
export const getFhirPatientSchema = paramsSchema;

export const setFhirPatientSchema = paramsSchema.merge(payloadSchema);

// Export types
export type GetFhirPatientInput = TypeOf<typeof getFhirPatientSchema>;
export type SetFhirPatientInput = TypeOf<typeof setFhirPatientSchema>;
