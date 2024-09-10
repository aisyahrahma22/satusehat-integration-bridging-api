import { boolean, number, object, string, TypeOf } from 'zod';

// Define schema for common parameters
const paramsSchema = object({
  registrationId: string().nonempty('Registration ID is required'),
  hospitalId: string().nonempty('Hospital ID is required'),
});

// Define schema for payload
const payloadSchema = object({
  active: boolean().optional(),
  datetime: string(),
  vitalSign: object({
    pulseRate: number(),
    respiratoryRate: number(),
    oxygenSaturation: number(),
    bodyTemperature: number(),
    bloodPressure: string(),
  }).optional(),
});

// Export schemas
export const getFhirObservationSchema = paramsSchema;

export const setFhirObservationSchema = paramsSchema.merge(payloadSchema);

// Export types
export type GetFhirObservationInput = TypeOf<typeof getFhirObservationSchema>;
export type SetFhirObservationInput = TypeOf<typeof setFhirObservationSchema>;
