import { Router } from "express";
import { schedulerLab  } from "../../controllers/fhir/fhirLaboratory.controller";

const fhirLaboratoryRoute = Router();
fhirLaboratoryRoute.post("/scheduler-lab", [], schedulerLab);
export default fhirLaboratoryRoute;
