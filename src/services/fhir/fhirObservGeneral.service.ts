import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirObservGeneralModel, { FhirObservGeneralDocument, FhirObservGeneralInput } from "../../models/fhir/fhirObservGeneral.model";

export async function doCreate(input: FhirObservGeneralInput) {
  const metricsLabels = {
    operation: "create-fhir-observGeneral",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirObservGeneralModel.create(input);
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
    operation: "find-fhir-observGeneral",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirObservGeneralModel.findOne(query, {}, options)
      .select("_id  fhirObservGeneralId category")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doUpdate(
  query: FilterQuery<FhirObservGeneralDocument>,
  update: UpdateQuery<FhirObservGeneralDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-observGeneral",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirObservGeneralModel.findOneAndUpdate(query, update,options)
      .select("_id  fhirObservGeneralId category")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doFindAll(
  query: FilterQuery<FhirObservGeneralDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-observGeneral",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirObservGeneralModel.find(query, {}, options)
    .select("_id  fhirObservGeneralId category")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}