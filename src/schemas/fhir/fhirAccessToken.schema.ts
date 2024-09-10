import { object, string, TypeOf } from 'zod';

const paramsSchema = object({
  hospitalId: string().nonempty('Hospital ID is required'),
});

export const getFhirAccessTokenSchema = object({
  params: paramsSchema,
});

export type GetFhirAccessTokenInput = TypeOf<typeof getFhirAccessTokenSchema>;
