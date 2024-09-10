import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhiMedicineReceiptModel, { FhirMedicineReceiptDocument, FhirMedicineReceiptInput } from "../../models/fhir/fhirMedicineReceipt.model";

export async function doCreate(input: FhirMedicineReceiptInput) {
  const metricsLabels = {
    operation: "create-fhir-medicine-receipt",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhiMedicineReceiptModel.create(input);
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
    operation: "find-fhir-medicine-receipt",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhiMedicineReceiptModel.findOne(query, {}, options)
    .select("_id description kfaCodeGroup kfaNameGroup fhirResponse registrationId hospitalId dosageCode dosageName pmrReceiptId fhirMedicineReceiptId")      
    .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doUpdate(
  query: FilterQuery<FhirMedicineReceiptDocument>,
  update: UpdateQuery<FhirMedicineReceiptDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-medicine-receipt",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhiMedicineReceiptModel.findOneAndUpdate(query, update,options)
      .select("_id description kfaCodeGroup kfaNameGroup fhirResponse registrationId hospitalId dosageCode dosageName pmrReceiptId fhirMedicineReceiptId ingredientItem pmrReceiptConcoctionId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doFindAll(
  query: FilterQuery<FhirMedicineReceiptDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-medicine-receipt",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhiMedicineReceiptModel.find(query, {}, options)
    .select("_id description kfaCodeGroup kfaNameGroup fhirResponse registrationId hospitalId dosageCode dosageName pmrReceiptId fhirMedicineReceiptId ingredientItem pmrReceiptConcoctionId")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}