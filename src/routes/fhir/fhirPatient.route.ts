import { Router } from "express";
import { getHandler, setHandler} from "../../controllers/fhir/fhirPatient.controller";
import validateResource from "../../middleware/validateResource";
import { getFhirPatientSchema, setFhirPatientSchema } from "../../schemas/fhir/fhirPatient.schema";

const fhirPatientRoute = Router();

fhirPatientRoute.get("/:hospitalId/:patientId", [validateResource(getFhirPatientSchema)], getHandler);
fhirPatientRoute.post("/:hospitalId/:patientId", [validateResource(setFhirPatientSchema)]);

export default fhirPatientRoute;
