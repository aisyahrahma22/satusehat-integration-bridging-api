
import { Router } from "express";
import { isAuthenticated } from "../middleware/authenticated";
import validateResource from "../middleware/validateResource";
import { getHospitalHandler, updateFhirSecretHospitalHandler, updateHospitalConfigHandler } from "../controllers/hospital.controller";
import { getHospitalSchema,  updateFhirSecretHospitalSchema,updateHospitalConfigSchema} from "../schemas/hospital.schema";

  
const hospitalRoute = Router();

hospitalRoute.get("/:uuid", [isAuthenticated, validateResource(getHospitalSchema)], getHospitalHandler);

hospitalRoute.put("/:uuid/fhirSecret", [isAuthenticated, validateResource(updateFhirSecretHospitalSchema)], updateFhirSecretHospitalHandler);
hospitalRoute.put("/:uuid/configs", [isAuthenticated, validateResource(updateHospitalConfigSchema)], updateHospitalConfigHandler);

export default hospitalRoute;
