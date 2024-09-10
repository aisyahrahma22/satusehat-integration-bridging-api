import { Router } from "express";
import { getHandler, setHandler } from "../../controllers/fhir/fhirLocation.controller";
import validateResource from "../../middleware/validateResource";
import { getFhirLocationSchema, setFhirLocationSchema } from "../../schemas/fhir/fhirLocation.schema";
const fhirLocationRoute = Router();

fhirLocationRoute.get("/:hospitalId/:referenceId", [validateResource(getFhirLocationSchema)], getHandler);
fhirLocationRoute.post("/:hospitalId/:referenceId", [validateResource(setFhirLocationSchema)]);

export default fhirLocationRoute;
