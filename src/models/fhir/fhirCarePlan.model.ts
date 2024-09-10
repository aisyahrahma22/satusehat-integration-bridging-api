import mongoose from "mongoose";

export interface FhirCarePlanInput {
  registrationId: string;
  encounterId: string;
  fhirCareplanId: string;
  procedureName: string;
}

export interface FhirCarePlanDocument extends FhirCarePlanInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const FhirCarePlanSchema = new mongoose.Schema(
  {
    encounterId: { type: String, required: true },
    registrationId: { type: String, required: true },
    procedureName: { type: String },
    notes: { type: String },
    createdAt: { type: Date},
    active: { type: Boolean},
    procedureUuid: { type: String },
    fhirRequest:  { type: Object },
    fhirCareplanId: { type: String },
    fhirResponse: { type: Object },
    fhirResourceType:{ type: String },
  },
  {
    timestamps: true,
  }
);

FhirCarePlanSchema.pre("save", async function (next) {
  return next();
});

const FhirCarePlanModel = mongoose.model<FhirCarePlanDocument>(
  "Fhir_CarePlan",
  FhirCarePlanSchema
);

export default FhirCarePlanModel;
