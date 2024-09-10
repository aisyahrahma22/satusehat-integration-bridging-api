import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirServiceRequestModel, { FhirServiceRequestDocument, FhirServiceRequestInput } from "../../models/fhir/fhirServiceRequest.model";

export async function doCreate(input: FhirServiceRequestInput) {
  const metricsLabels = {
    operation: "create-fhir-serviceRequest",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirServiceRequestModel.create(input);
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
    operation: "find-fhir-serviceRequest",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirServiceRequestModel.findOne(query, {}, options)
      .select("_id refId fhirResponse fhirServiceReqId category")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doUpdate(
  query: FilterQuery<FhirServiceRequestDocument>,
  update: UpdateQuery<FhirServiceRequestDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-serviceRequest",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirServiceRequestModel.findOneAndUpdate(query, update,options)
      .select("_id refId fhirResponse fhirServiceReqId category")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doFindAll(
  query: FilterQuery<FhirServiceRequestDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-serviceRequest",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirServiceRequestModel.find(query, {}, options)
      .select("_id refId fhirResponse fhirServiceReqId category")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}