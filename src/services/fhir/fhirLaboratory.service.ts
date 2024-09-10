import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirLaboratoryModel, { FhirLaboratoryDocument, FhirLaboratoryInput } from "../../models/fhir/fhirLaboratory.model";

export async function doCreate(input: FhirLaboratoryInput) {
  const metricsLabels = {
    operation: "create-fhir-laboratory",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirLaboratoryModel.create(input);
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
    operation: "find-fhir-laboratory",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirLaboratoryModel.findOne(query, {}, options)
      .select("_id encounterId fhirResponse pmrLabUuid description display category type loincName loincCode specimenName specimenCode detail createdAt fhirDiagnosticLabId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doUpdate(
  query: FilterQuery<FhirLaboratoryDocument>,
  update: UpdateQuery<FhirLaboratoryDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-laboratory",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirLaboratoryModel.findOneAndUpdate(query, update,options)
      .select("_id encounterId pmrLabUuid description fhirResponse display category type loincName loincCode specimenName specimenCode detail createdAt fhirDiagnosticLabId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doFindAll(
  query: FilterQuery<FhirLaboratoryDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-laboratory",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirLaboratoryModel.find(query, {}, options)
      .select("_id encounterId pmrLabUuid description fhirResponse display category type loincName loincCode specimenName specimenCode detail createdAt fhirDiagnosticLabId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}