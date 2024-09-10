import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirLocationModel, { FhirLocationDocument, FhirLocationInput } from "../../models/fhir/fhirLocation.model";

export async function doCreate(input: FhirLocationInput) {
  const metricsLabels = {
    operation: "create-fhir-location",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirLocationModel.create(input);
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doFind(
  query: FilterQuery<FhirLocationDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-location",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirLocationModel.findOne(query, {}, options)
      .select("source referenceId physicalType fhirId fhirName active")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doUpdate(
  query: FilterQuery<FhirLocationDocument>,
  update: UpdateQuery<FhirLocationDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-location",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirLocationModel.findOneAndUpdate(query, update,options)
      .select("source referenceId physicalType fhirId fhirName active")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}
