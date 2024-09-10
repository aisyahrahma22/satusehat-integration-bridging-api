import { Router } from "express";
import { getHandler, setHandler } from "../../controllers/fhir/fhirCarePlan.controller";
import validateResource from "../../middleware/validateResource";
import { getFhirPrognosaSchema, setFhirPrognosaSchema } from "../../schemas/fhir/fhirPrognosa.schema";


const fhirPrognosaRoute = Router();

fhirPrognosaRoute.get("/:hospitalId/:registrationId", [validateResource(getFhirPrognosaSchema)], getHandler);
fhirPrognosaRoute.post("/:hospitalId/:registrationId", [validateResource(setFhirPrognosaSchema)]);

export default fhirPrognosaRoute;
