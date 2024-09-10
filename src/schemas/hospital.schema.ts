import { boolean, object, string, TypeOf } from 'zod';

const payloadFhirSecret = object({
  body: object({
    organizationId: string().nonempty('Organization id is required'),
    clientKey: string().nonempty('Client key is required'),
    secretKey: string().nonempty('Secret key is required'),
  }),
});

const payloadConfigs = object({
  body: object({
    enableFhirEncounter: boolean(),
  }),
});

// Define common parameters schema
const paramsSchema = object({
  params: object({
    uuid: string().nonempty('Uuid is required'),
  }),
});

// Export schemas
export const getHospitalSchema = paramsSchema;
export const updateFhirSecretHospitalSchema = paramsSchema.merge(payloadFhirSecret);
export const updateHospitalConfigSchema = paramsSchema.merge(payloadConfigs);

// Export types
export type GetHospitalInput = TypeOf<typeof getHospitalSchema>;
export type UpdateFhirSecretHospitalInput = TypeOf<typeof updateFhirSecretHospitalSchema>;
export type UpdateHospitalConfigInput = TypeOf<typeof updateHospitalConfigSchema>;
