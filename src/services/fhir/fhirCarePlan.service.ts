import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirCarePlanModel, { FhirCarePlanDocument, FhirCarePlanInput } from "../../models/fhir/fhirCarePlan.model";

export async function doCreate(input: FhirCarePlanInput) {
  const metricsLabels = {
    operation: "create-fhir-carePlan",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirCarePlanModel.create(input);
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
    operation: "find-fhir-carePlan",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirCarePlanModel.findOne(query, {}, options)
      .select("_id encounterId createdAt procedureUuid notes procedureName fhirCareplanId registrationId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doUpdate(
  query: FilterQuery<FhirCarePlanDocument>,
  update: UpdateQuery<FhirCarePlanDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-carePlan",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirCarePlanModel.findOneAndUpdate(query, update,options)
      .select("_id encounterId createdAt procedureUuid notes procedureName fhirCareplanId registrationId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doFindAll(
  query: FilterQuery<FhirCarePlanDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-carePlan",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirCarePlanModel.find(query, {}, options)
    .select("_id encounterId createdAt procedureUuid notes procedureName fhirCareplanId registrationId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}