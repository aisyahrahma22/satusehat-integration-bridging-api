import { Router } from "express";
import {getHandler, setHandler } from "../../controllers/fhir/fhirProcedure.controller";
import validateResource from "../../middleware/validateResource";
import { getFhirProcedureSchema, setFhirProcedureSchema } from "../../schemas/fhir/fhirProcedure.schema";

const fhirProcedureRoute = Router();

fhirProcedureRoute.get("/:hospitalId/:registrationId", [validateResource(getFhirProcedureSchema)], getHandler);
fhirProcedureRoute.post("/:hospitalId/:registrationId", [validateResource(setFhirProcedureSchema)]);

export default fhirProcedureRoute;
