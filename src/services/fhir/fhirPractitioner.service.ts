import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirPractitionerModel, { FhirPractitionerDocument, FhirPractitionerInput } from "../../models/fhir/fhirPractitioner.model";

export async function doCreate(input: FhirPractitionerInput) {
  const metricsLabels = {
    operation: "create-fhir-practitioner",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPractitionerModel.create(input);
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doFindOne(
  query: FilterQuery<FhirPractitionerDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-practitioner",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPractitionerModel.findOne(query, {}, options).lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doFind(
  query: FilterQuery<FhirPractitionerDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-practitioner-reference",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPractitionerModel.aggregate([
      {
        $match: {
          ...query
        }
      },
      {
        $lookup: {
          from: "fhir_practitioner_references",
          localField: "_id",
          foreignField: "fhirPractitionerId",
          as: "fhirPractitionerReference"
        }
      },
      { 
        $unwind: "$fhirPractitionerReference" 
      },
      {
        $project: {
          _id: 1,
          identityNumber: 1,
          fhirId: 1,
          fhirName: 1,
          fhirGender: 1,
          fhirMeta: 1,
          fhirResourceType: 1,
          active: 1,
          fhirPractitionerReference: 1
        }
      }
    ]);
    timer({ ...metricsLabels, success: "true" });
    return result[0];
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

