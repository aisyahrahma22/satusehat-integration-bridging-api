import { Router } from "express";
import { getHandler, setHandler } from "../../controllers/fhir/fhirObservation.controller";
import validateResource from "../../middleware/validateResource";
import { getFhirObservationSchema, setFhirObservationSchema } from "../../schemas/fhir/fhirObservation.schema";

const fhirObservationRoute = Router();

fhirObservationRoute.get("/:hospitalId/:registrationId", [validateResource(getFhirObservationSchema)], getHandler);
fhirObservationRoute.post("/:hospitalId/:registrationId", [validateResource(setFhirObservationSchema)]);

export default fhirObservationRoute;
