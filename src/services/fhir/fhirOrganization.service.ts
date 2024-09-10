import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirOrganizationModel, { FhirOrganizationDocument, FhirOrganizationInput } from "../../models/fhir/fhirOrganization.model";

export async function doCreate(input: FhirOrganizationInput) {
  const metricsLabels = {
    operation: "create-fhir-organization",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirOrganizationModel.create(input);
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doFind(
  query: FilterQuery<FhirOrganizationDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-organization",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirOrganizationModel.findOne(query, {}, options)
      .select("organizationName organizationAddress organizationPhone organizationType fhirId active")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doUpdate(
  query: FilterQuery<FhirOrganizationDocument>,
  update: UpdateQuery<FhirOrganizationDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-organization",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirOrganizationModel.findOneAndUpdate(query, update,options)
      .select("organizationName organizationAddress organizationPhone organizationType fhirId active")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}
