import { boolean, number, object, string, TypeOf, array, any } from 'zod';

// Define schema for common parameters
const paramsSchema = object({
  hospitalId: string().nonempty('Hospital ID is required'),
  registrationId: string().nonempty('Registration ID is required'),
});

// Define schema for payload in standard encounters
const payloadSchema = object({
  status: string().nonempty('Status is required'),
  patientId: string().nonempty('Patient ID is required'),
  registrationDate: string().optional(),
  medicalCategory: string().optional(),
  doctorId: string().optional(),
  roomId: string().optional(),
  processDate: string().nullable(),
  isPaid: boolean().default(false),
  diagnoses: array(object({
    code: string().optional(),
    isPrimer: boolean().optional(),
    name: string().optional(),
    createdAt: string().optional(),
  })).optional(),
});

// Define schema for payload in single encounters
const singlePayloadSchema = object({
  patientId: string().nonempty('Patient ID is required'),
  doctorId: string().nonempty('Doctor ID is required'),
  roomId: string().nonempty('Room ID is required'),
  isPaid: boolean(),
  registrationDate: string().nonempty('Registration Date is required'),
  consultationDate: string().nonempty('Consultation Date is required'),
  diagnoses: any().optional(),
  radiology: any().optional(),
  laboratory: any().optional(),
  medicalCategory: string().optional(),
  observation: object({
    active: boolean(),
    datetime: string(),
    vitalSign: object({
      pulseRate: number(),
      respiratoryRate: number(),
      oxygenSaturation: number(),
      bodyTemperature: number(),
      bloodPressure: string(),
    }),
  }).optional(),
  carePlan: any().optional(),
  procedure: any().optional(),
  progress: any().optional(),
  prognosa: any().optional(),
  allergy: any().optional(),
  medicineReceipt: any().optional(),
  isBaby: boolean(),
  birthInformation: any().optional(),
});

// Export schemas
export const getFhirEncounterSchema = paramsSchema;

export const setFhirEncounterSchema = paramsSchema.merge(payloadSchema);

export const setFhirSingleEncounterSchema = paramsSchema.merge(singlePayloadSchema);

// Export types
export type GetFhirEncounterInput = TypeOf<typeof getFhirEncounterSchema>;
export type SetFhirEncounterInput = TypeOf<typeof setFhirEncounterSchema>;
export type SetFhirSingleEncounterInput = TypeOf<typeof setFhirSingleEncounterSchema>;
