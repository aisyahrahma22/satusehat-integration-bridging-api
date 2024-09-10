import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirAllergyModel, { FhirAllergyDocument, FhirAllergyInput } from "../../models/fhir/fhirAllergy.model";

export async function doCreate(input: FhirAllergyInput) {
  const metricsLabels = {
    operation: "create-fhir-allergy",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirAllergyModel.create(input);
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
    operation: "find-fhir-allergy",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirAllergyModel.findOne(query, {}, options)
      .select("_id encounterId category description createdAt fhirAllergyId fhirResponse code name pmrAllergyId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doUpdate(
  query: FilterQuery<FhirAllergyDocument>,
  update: UpdateQuery<FhirAllergyDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-allergy",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirAllergyModel.findOneAndUpdate(query, update,options)
      .select("_id encounterId category description createdAt fhirAllergyId fhirResponse code name pmrAllergyId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doFindAll(
  query: FilterQuery<FhirAllergyDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-allergy",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirAllergyModel.find(query, {}, options)
      .select("_id encounterId category description createdAt fhirAllergyId fhirResponse code name pmrAllergyId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}