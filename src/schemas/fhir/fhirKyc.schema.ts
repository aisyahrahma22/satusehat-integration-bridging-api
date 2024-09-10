import { object, string, TypeOf } from 'zod';

// Define schema for payload
const payloadSchema = object({
  hospitalId: string().nonempty('Hospital ID is required'),
  name: string().nonempty('Name is required'),
  nik: string().nonempty('NIK is required'),
});

// Export schema
export const setFhirKycSchema = payloadSchema;

// Export type
export type SetFhirKycInput = TypeOf<typeof setFhirKycSchema>;
