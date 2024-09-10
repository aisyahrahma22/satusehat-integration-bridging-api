import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirPractitionerReferenceModel, { FhirPractitionerReferenceDocument, FhirPractitionerReferenceInput } from "../../models/fhir/fhirPractitionerReference.model";

export async function doCreate(input: FhirPractitionerReferenceInput) {
  const metricsLabels = {
    operation: "create-fhir-practitioner-reference",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPractitionerReferenceModel.create(input);
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doFindOne(
  query: FilterQuery<FhirPractitionerReferenceDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-one-practitioner-reference",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPractitionerReferenceModel.findOne(query, {}, options).lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}


export async function doFind(
  query: FilterQuery<FhirPractitionerReferenceDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-practitioner-reference",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPractitionerReferenceModel.aggregate([
      {
        $match: {
          ...query
        }
      },
      {
        $lookup: {
          from: "fhir_practitioners",
          localField: "fhirPractitionerId",
          foreignField: "_id",
          as: "fhirPractitioner"
        }
      },
      { 
        $unwind: "$fhirPractitioner" 
      },
      {
        $project: {
          source: 1,
          referenceId: 1,
          fhirId: "$fhirPractitioner.fhirId",
          fhirName: "$fhirPractitioner.fhirName",
          fhirGender: "$fhirPractitioner.fhirGender"
        }
      }
    ]);
    timer({ ...metricsLabels, success: "true" });
    return result[0];
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doUpdate(
  query: FilterQuery<FhirPractitionerReferenceDocument>,
  update: UpdateQuery<FhirPractitionerReferenceDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-practitioner-reference",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPractitionerReferenceModel.findOneAndUpdate(query, update,options).lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}
