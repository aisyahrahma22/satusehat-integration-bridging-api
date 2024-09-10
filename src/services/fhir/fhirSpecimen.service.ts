import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirSpecimenModel, { FhirSpecimenDocument, FhirSpecimenInput } from "../../models/fhir/fhirSpecimen.model";

export async function doCreate(input: FhirSpecimenInput) {
  const metricsLabels = {
    operation: "create-fhir-specimen",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirSpecimenModel.create(input);
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
    operation: "find-fhir-specimen",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirSpecimenModel.findOne(query, {}, options)
      .select("_id refId fhirResponse fhirSpecimenId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doUpdate(
  query: FilterQuery<FhirSpecimenDocument>,
  update: UpdateQuery<FhirSpecimenDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-specimen",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirSpecimenModel.findOneAndUpdate(query, update,options)
      .select("_id refId fhirResponse fhirSpecimenId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doFindAll(
  query: FilterQuery<FhirSpecimenDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-specimen",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirSpecimenModel.find(query, {}, options)
      .select("_id refId fhirResponse fhirSpecimenId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}