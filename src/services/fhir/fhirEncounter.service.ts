import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirEncounterModel, { FhirEncounterDocument, FhirEncounterInput } from "../../models/fhir/fhirEncounter.model";

export async function doCreate(input: FhirEncounterInput) {
  const metricsLabels = {
    operation: "create-fhir-encounter",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirEncounterModel.create(input);
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
    operation: "find-fhir-encounter",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirEncounterModel.findOne(query, {}, options)
    .select("hospitalId patientFhirId patientName doctorFhirId doctorName fhirEncounterId locationFhirId locationReferenceName diagnoses status history description registrationId fhirRequest _id")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doUpdate(
  query: FilterQuery<FhirEncounterDocument>,
  update: UpdateQuery<FhirEncounterDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-encounter",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirEncounterModel.findOneAndUpdate(query, update,options)
    .select("hospitalId  medicalCategory patientFhirId patientName doctorFhirId doctorName fhirEncounterId locationFhirId locationReferenceName diagnoses status history description registrationId _id")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doFindAll(
  query: FilterQuery<FhirEncounterDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-encounter",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirEncounterModel.find(query, {}, options)
    .select("hospitalId  medicalCategory patientFhirId patientName doctorFhirId doctorName fhirEncounterId locationFhirId locationReferenceName diagnoses status history description registrationId _id")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}
