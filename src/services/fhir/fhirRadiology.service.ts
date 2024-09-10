import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirRadiologyModel, { FhirRadiologyDocument, FhirRadiologyInput } from "../../models/fhir/fhirRadiology.model";

export async function doCreate(input: FhirRadiologyInput) {
  const metricsLabels = {
    operation: "create-fhir-radiology",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirRadiologyModel.create(input);
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
    operation: "find-fhir-radiology",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirRadiologyModel.findOne(query, {}, options)
      .select("_id encounterId pmRadUuid description fhirResponse display category loincName loincCode createdAt fhirDiagnosticRadId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doUpdate(
  query: FilterQuery<FhirRadiologyDocument>,
  update: UpdateQuery<FhirRadiologyDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-radiology",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirRadiologyModel.findOneAndUpdate(query, update,options)
      .select("_id encounterId pmRadUuid description fhirResponse display category loincName loincCode createdAt fhirDiagnosticRadId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doFindAll(
  query: FilterQuery<FhirRadiologyDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-radiology",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirRadiologyModel.find(query, {}, options)
    .select("_id encounterId pmrRadUuid description fhirResponse display category  loincName loincCode createdAt fhirDiagnosticRadId")
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}