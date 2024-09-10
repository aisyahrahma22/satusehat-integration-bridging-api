import mongoose from "mongoose";
export interface FhirConditionInput {
  encounterId: string;
  fhirConditionId: string;
  pmrId: string;
  description: string;
}
export interface FhirConditionDocument extends FhirConditionInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}
const FhirConditionSchema = new mongoose.Schema(
  {
    encounterId: { type: String, required: true },
    code: { type: String },
    name: { type: String },
    pmrId: { type: String },
    fhirRequest: { type: Object },
    fhirResponse: { type: Object },
    fhirConditionId: { type: String },
    fhirResourceType:{type: String},
    active: { type: Boolean, default: true },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);
FhirConditionSchema.pre("save", async function (next) {
  return next();
});
const FhirConditionModel = mongoose.model<FhirConditionDocument>(
  "Fhir_Condition",
  FhirConditionSchema
);
export default FhirConditionModel;
