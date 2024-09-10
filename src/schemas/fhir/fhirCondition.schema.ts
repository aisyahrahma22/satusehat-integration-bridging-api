import { boolean, object, string, TypeOf } from 'zod';

// Define schema for params
const paramsSchema = object({
  registrationId: string().nonempty('Registration ID is required'),
  hospitalId: string().nonempty('Hospital ID is required'),
});

// Define schema for payload
const payloadSchema = object({
  active: boolean().optional(),
  code: string().optional(),
  name: string().optional(),
  pmrId: string().optional(),
});

// Export schemas
export const getFhirConditionSchema = paramsSchema;

export const setFhirConditionSchema = paramsSchema.merge(payloadSchema);

// Export types
export type GetFhirConditionInput = TypeOf<typeof getFhirConditionSchema>;
export type SetFhirConditionInput = TypeOf<typeof setFhirConditionSchema>;
