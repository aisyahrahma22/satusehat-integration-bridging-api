import { Router } from "express";
import { getHandler, setHandler } from "../../controllers/fhir/fhirCarePlan.controller";
import validateResource from "../../middleware/validateResource";
import { getFhirCarePlanSchema, setFhirCarePlanSchema } from "../../schemas/fhir/fhirCarePlan.schema";

const fhirCarePlanRoute = Router();

fhirCarePlanRoute.get("/:hospitalId/:registrationId", [validateResource(getFhirCarePlanSchema)], getHandler);
fhirCarePlanRoute.post("/:hospitalId/:registrationId", [validateResource(setFhirCarePlanSchema)]);

export default fhirCarePlanRoute;
