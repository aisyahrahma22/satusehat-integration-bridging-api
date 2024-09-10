import { Router } from "express";
import { setHandler } from "../../controllers/fhir/fhirKyc.controller";
import validateResource from "../../middleware/validateResource";
import { setFhirKycSchema } from "../../schemas/fhir/fhirKyc.schema";

const fhirKycRoute = Router();

fhirKycRoute.post("/", [validateResource(setFhirKycSchema)], setHandler);

export default fhirKycRoute;