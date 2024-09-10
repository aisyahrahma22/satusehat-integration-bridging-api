import { Router } from "express";
import hospitalRoute from "./hospital.route";
import fhirRoute from "./fhir";

const routes = Router();

routes.use("/api/hospital", hospitalRoute);
routes.use("/api/fhir", fhirRoute);

export default routes;
