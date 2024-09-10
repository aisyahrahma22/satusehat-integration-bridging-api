import { boolean, object, string, TypeOf, array } from 'zod';

const paramsSchema = object({
  hospitalId: string().nonempty('Hospital ID is required'),
  registrationId: string().nonempty('Registration ID is required'),
});


const payloadSchema = object({
  hospitalId: string().nonempty('Hospital ID is required'),
  registrationId: string().nonempty('Registration ID is required'),
  item: array(object({
    allergyItemName: string().optional(),
    code: string().optional(),
    notes: string().optional(),
    category: string().optional(),
    createdAt: string().optional(),
    active: boolean().optional(),
    uuid: string().optional(),
  })).optional(),
});

export const getFhirAllergySchema = paramsSchema;
export const setFhirAllergySchema = paramsSchema.merge(payloadSchema);
export type GetFhirAllergyInput = TypeOf<typeof getFhirAllergySchema>;
export type SetFhirAllergyInput = TypeOf<typeof setFhirAllergySchema>;
