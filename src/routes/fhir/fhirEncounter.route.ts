import { Router } from "express";
import {getHandler, scheduler, setHandler, singleEncounter, duplicateScheduler, itemScheduler} from "../../controllers/fhir/fhirEncounter.controller";
import validateResource from "../../middleware/validateResource";
import { getFhirEncounterSchema, setFhirEncounterSchema, setFhirSingleEncounterSchema } from "../../schemas/fhir/fhirEncounter.schema";

const fhirEncounterRoute = Router();

fhirEncounterRoute.get("/:hospitalId/:registrationId", [validateResource(getFhirEncounterSchema)], getHandler);
fhirEncounterRoute.post("/:hospitalId/:registrationId", [validateResource(setFhirEncounterSchema)]);
fhirEncounterRoute.post("/single/:hospitalId/:registrationId", [validateResource(setFhirSingleEncounterSchema)]);
fhirEncounterRoute.post("/scheduler", [], scheduler);
fhirEncounterRoute.post("/duplicate", [], duplicateScheduler);
fhirEncounterRoute.post("/item", [], itemScheduler);

export default fhirEncounterRoute;
