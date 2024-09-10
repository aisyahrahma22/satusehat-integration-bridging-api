import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirObservationModel, { FhirObservationDocument, FhirObservationInput } from "../../models/fhir/fhirObservation.model";

export async function doCreate(input: FhirObservationInput) {
  const metricsLabels = {
    operation: "create-fhir-observation",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirObservationModel.create(input);
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doFind(
  query: FilterQuery<FhirObservationDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-observation",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirObservationModel.findOne(query, {}, options)
      .select("_id datetime category value encounterId registrationId fhirObservationId status")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doUpdate(
  query: FilterQuery<FhirObservationDocument>,
  update: UpdateQuery<FhirObservationDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-observation",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirObservationModel.findOneAndUpdate(query, update,options)
      .select("_id datetime category value encounterId registrationId status fhirObservationId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doFindAll(
  query: FilterQuery<FhirObservationDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-observation",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirObservationModel.find(query, {}, options)
      .select("_id datetime category value encounterId registrationId fhirObservationId status")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}
