import { Router } from "express";
import { getHandler } from "../../controllers/fhir/fhirAccessToken.controller";
import validateResource from "../../middleware/validateResource";
import { getFhirAccessTokenSchema } from "../../schemas/fhir/fhirAccessToken.schema";

const fhirAccessTokenRoute = Router();

fhirAccessTokenRoute.get("/:hospitalId", [validateResource(getFhirAccessTokenSchema)], getHandler);

export default fhirAccessTokenRoute;
