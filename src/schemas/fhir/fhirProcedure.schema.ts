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
    patientMedicalRecordId: string().nonempty('PMR ID is required'),
    clinicProceduresId: string().nonempty('Clinic Procedure ID is required'),
    pmrRefId: string().optional(),
    uuid: string().optional(),
    ipCode: string().optional(),
    createdAt: string().optional(),
    ipName: string().optional(),
    categoryCode: string().optional(),
    categoryName: string().optional(),
    active: string().optional(),
  })).optional(),
});

// Export schemas
export const getFhirProcedureSchema = paramsSchema;

export const setFhirProcedureSchema = paramsSchema.merge(payloadSchema);

// Export types
export type GetFhirProcedureInput = TypeOf<typeof getFhirProcedureSchema>;
export type SetFhirProcedureInput = TypeOf<typeof setFhirProcedureSchema>;
