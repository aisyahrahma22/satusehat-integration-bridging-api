import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirAccessTokenModel, { FhirAccessTokenDocument, FhirAccessTokenInput } from "../../models/fhir/fhirAccessToken.model";

export async function doCreate(input: FhirAccessTokenInput) {
  const metricsLabels = {
    operation: "create-fhir-access-token",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await Promise.resolve(FhirAccessTokenModel.create(input));
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doFind(
  query: FilterQuery<FhirAccessTokenDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-access-token",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await Promise.resolve(FhirAccessTokenModel.findOne(query, {}, options).lean());
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doUpdate(
  query: FilterQuery<FhirAccessTokenDocument>,
  update: UpdateQuery<FhirAccessTokenDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-access-token",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await Promise.resolve(FhirAccessTokenModel.findOneAndUpdate(query, update,options).lean());
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}
