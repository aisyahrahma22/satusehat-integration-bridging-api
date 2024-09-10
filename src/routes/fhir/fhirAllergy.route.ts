import { Router } from "express";
import { getHandler, setHandler } from "../../controllers/fhir/fhirCarePlan.controller";
import validateResource from "../../middleware/validateResource";
import { getFhirAllergySchema, setFhirAllergySchema } from "../../schemas/fhir/fhirAllergy.schema";

const fhirAllergyRoute = Router();

fhirAllergyRoute.get("/:hospitalId/:registrationId", [validateResource(getFhirAllergySchema)], getHandler);
fhirAllergyRoute.post("/:hospitalId/:registrationId", [validateResource(setFhirAllergySchema)]);

export default fhirAllergyRoute;
