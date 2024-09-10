import { Router } from "express";
import { getHandler, setHandler } from "../../controllers/fhir/fhirPractitioner.controller";
import validateResource from "../../middleware/validateResource";
import { getFhirPractitionerSchema, setFhirPractitionerSchema } from "../../schemas/fhir/fhirPractitioner.schema";

const fhirPractitionerRoute = Router();

fhirPractitionerRoute.get("/:hospitalId/:referenceId", [validateResource(getFhirPractitionerSchema)], getHandler);
fhirPractitionerRoute.post("/:hospitalId/:referenceId", [validateResource(setFhirPractitionerSchema)]);

export default fhirPractitionerRoute;
