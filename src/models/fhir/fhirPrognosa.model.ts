import mongoose from "mongoose";

export interface FhirPrognosaInput {
  registrationId: string;
  encounterId: string;
  fhirPrognosaId: string;
  pmrPrognosaId: string;
  code: any
}

export interface FhirPrognosaDocument extends FhirPrognosaInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const FhirPrognosaSchema = new mongoose.Schema(
  {
    encounterId: { type: String, required: true },
    registrationId: { type: String, required: true },
    name: { type: String },
    code: { type: Number},
    notes: { type: String },
    createdAt: { type: Date},
    active: { type: Boolean},
    pmrPrognosaId: { type: String },
    fhirRequest:  { type: Object },
    fhirPrognosaId: { type: String },
    fhirResponse: { type: Object },
    fhirResourceType:{ type: String },
  },
  {
    timestamps: true,
  }
);

FhirPrognosaSchema.pre("save", async function (next) {
  return next();
});

const FhirPrognosaModel = mongoose.model<FhirPrognosaDocument>(
  "Fhir_Prognosa",
  FhirPrognosaSchema
);

export default FhirPrognosaModel;
