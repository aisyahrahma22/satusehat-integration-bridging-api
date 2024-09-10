import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirEncounterDuplicateModel, { FhirEncounterDuplicateDocument, FhirEncounterDuplicateInput } from "../../models/fhir/fhirEncounterDuplicate.model";
export async function doCreate(input: FhirEncounterDuplicateInput) {
  const metricsLabels = {
    operation: "create-fhir-encounter-duplicate",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirEncounterDuplicateModel.create(input);
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}
export async function doFind(
  query: any,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-encounter-duplicate",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirEncounterDuplicateModel.findOne(query, {}, options)
      .select("_id encounterId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}
export async function doUpdate(
  query: FilterQuery<FhirEncounterDuplicateDocument>,
  update: UpdateQuery<FhirEncounterDuplicateDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-encounter-duplicate",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirEncounterDuplicateModel.findOneAndUpdate(query, update,options)
    .select("_id encounterId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}
export async function doFindAll(
  query: FilterQuery<FhirEncounterDuplicateDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-encounter",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirEncounterDuplicateModel.find(query, {}, options)
    .select("_id encounterId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}