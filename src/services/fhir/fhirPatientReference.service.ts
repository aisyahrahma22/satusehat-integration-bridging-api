import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { databaseResponseTimeHistogram } from "../../utils/metrics";
import FhirPatientReferenceModel, { FhirPatientReferenceDocument, FhirPatientReferenceInput } from "../../models/fhir/fhirPatientReference.model";

export async function doCreate(input: FhirPatientReferenceInput) {
  const metricsLabels = {
    operation: "create-fhir-patient-reference",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPatientReferenceModel.create(input);
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doFind(
  query: FilterQuery<FhirPatientReferenceDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-patient-reference",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPatientReferenceModel.aggregate([
      {
        $match: {
          ...query
        }
      },
      {
        $lookup: {
          from: "fhir_patients",
          localField: "fhirPatientId",
          foreignField: "_id",
          as: "fhirPatient"
        }
      },
      { 
        $unwind: "$fhirPatient" 
      },
      {
        $project: {
          source: 1,
          referenceId: 1,
          fhirId: "$fhirPatient.fhirId",
          fhirName: "$fhirPatient.fhirName",
          fhirGender: "$fhirPatient.fhirGender"
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

export async function doFindOne(
  query: FilterQuery<FhirPatientReferenceDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "find-fhir-patient",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPatientReferenceModel.findOne(query, {}, options).lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}

export async function doUpdate(
  query: FilterQuery<FhirPatientReferenceDocument>,
  update: UpdateQuery<FhirPatientReferenceDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "update-fhir-patient-reference",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await FhirPatientReferenceModel.findOneAndUpdate(query, update,options).lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw e;
  }
}
