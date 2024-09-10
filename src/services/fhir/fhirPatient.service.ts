import { FilterQuery, QueryOptions } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirPatientModel, { FhirPatientDocument, FhirPatientInput } from "../../models/fhir/fhirPatient.model";

export async function doCreate(input: FhirPatientInput) {
  const metricsLabels = {
    operation: "create-fhir-patient",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPatientModel.create(input);
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doFind(
  query: FilterQuery<FhirPatientDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-patient",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPatientModel.findOne(query, {}, options).lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}
