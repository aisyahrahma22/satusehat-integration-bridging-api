import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirPrognosaModel, { FhirPrognosaDocument, FhirPrognosaInput } from "../../models/fhir/fhirPrognosa.model";

export async function doCreate(input: FhirPrognosaInput) {
  const metricsLabels = {
    operation: "create-fhir-prognosa",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPrognosaModel.create(input);
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
    operation: "find-fhir-prognosa",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPrognosaModel.findOne(query, {}, options)
      .select("_id encounterId createdAt fhirPrognosaId registrationId code name pmrPrognosaId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doUpdate(
  query: FilterQuery<FhirPrognosaDocument>,
  update: UpdateQuery<FhirPrognosaDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-prognosa",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPrognosaModel.findOneAndUpdate(query, update,options)
      .select("_id encounterId createdAt fhirPrognosaId registrationId code name pmrPrognosaId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}