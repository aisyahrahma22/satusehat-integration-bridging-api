import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirConditionModel, { FhirConditionDocument, FhirConditionInput } from "../../models/fhir/fhirCondition.model";

export async function doCreate(input: FhirConditionInput) {
  const metricsLabels = {
    operation: "create-fhir-condition",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirConditionModel.create(input);
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doFind(
  query: FilterQuery<FhirConditionDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-condition",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirConditionModel.findOne(query, {}, options)
      .select("_id code name description fhirResponse encounterId fhirConditionId pmrId active")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doUpdate(
  query: FilterQuery<FhirConditionDocument>,
  update: UpdateQuery<FhirConditionDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-condition",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirConditionModel.findOneAndUpdate(query, update,options)
      .select("_id code name description fhirResponse encounterId fhirConditionId pmrId active")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doFindAll(
  query: FilterQuery<FhirConditionDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-condition",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirConditionModel.find(query, {}, options)
      .select("_id code name fhirResponse encounterId fhirConditionId pmrId active")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}
