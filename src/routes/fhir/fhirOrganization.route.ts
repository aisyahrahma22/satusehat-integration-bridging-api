import { Router } from "express";
import { getHandler, setHandler } from "../../controllers/fhir/fhirOrganization.controller";
import validateResource from "../../middleware/validateResource";
import { getFhirOrganizationSchema, setFhirOrganizationSchema } from "../../schemas/fhir/fhirOrganization.schema";

const fhirOrganizationRoute = Router();

fhirOrganizationRoute.get("/:hospitalId", [validateResource(getFhirOrganizationSchema)], getHandler);
fhirOrganizationRoute.post("/:hospitalId", [validateResource(setFhirOrganizationSchema)]);

export default fhirOrganizationRoute;
