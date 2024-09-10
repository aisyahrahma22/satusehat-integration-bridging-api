import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import HospitalModel, {
  HospitalDocument,
} from "../models/hospital.model";
import { databaseResponseTimeHistogram } from "../utils/metrics";

export async function doFindHospital(
  query: FilterQuery<HospitalDocument>,
  options: QueryOptions = { lean: true }
) {
  const metricsLabels = {
    operation: "doFindHospital",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await HospitalModel.findOne(query, {}, options)
      .select("-_id uuid alias name groupId pcareSecret pcareInSecret icareInSecret jknInternalSecret jknExternalSecret aplicaresSecret vclaimSecret eclaimSecret eclaimUrl eclaimCoderNik fhirSecret queueFKTPSecret queueUserLogin configs wsBpjsFKTPSecret")
      .lean();
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}

export async function doUpdateHospital(
  query: FilterQuery<HospitalDocument>,
  update: UpdateQuery<HospitalDocument>,
  options: QueryOptions
) {
  const metricsLabels = {
    operation: "doUpdateHospital",
  };
  const timer = databaseResponseTimeHistogram.startTimer();
  try {
    const result = await HospitalModel.findOneAndUpdate(query, update, options);
    timer({ ...metricsLabels, success: "true" });
    return result;
  } catch (e: any) {
    timer({ ...metricsLabels, success: "false" });
    throw new Error(e);
  }
}
