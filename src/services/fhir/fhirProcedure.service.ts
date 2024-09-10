import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirProcedureModel, { FhirProcedureDocument, FhirProcedureInput } from "../../models/fhir/fhirProcedure.model";

export async function doCreate(input: FhirProcedureInput) {
  const metricsLabels = {
    operation: "create-fhir-procedure",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirProcedureModel.create(input);
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
    operation: "find-fhir-procedure",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirProcedureModel.findOne(query, {}, options)
      .select("_id encounterId fhirResponse description code name categoryName pmrRefId categoryCode patientMedicalRecordId clinicProceduresId datetime fhirProcedureId procedureUuid")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doUpdate(
  query: FilterQuery<FhirProcedureDocument>,
  update: UpdateQuery<FhirProcedureDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-procedure",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirProcedureModel.findOneAndUpdate(query, update,options)
    .select("_id encounterId fhirResponse description code name  createdAt updatedAt categoryName pmrRefId categoryCode patientMedicalRecordId clinicProceduresId datetime fhirProcedureId procedureUuid")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doFindAll(
  query: FilterQuery<FhirProcedureDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-procedure",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirProcedureModel.find(query, {}, options)
    .select("_id encounterId fhirResponse description code name createdAt updatedAt categoryName pmrRefId categoryCode patientMedicalRecordId clinicProceduresId datetime fhirProcedureId procedureUuid")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}
