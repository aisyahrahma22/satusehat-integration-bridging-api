import mongoose from "mongoose";

export interface FhirLaboratoryInput {
  encounterId: string;
  fhirDiagnosticLabId: string;
  pmrLabUuid: string;
  description: string;
}

export interface FhirLaboratoryDocument extends FhirLaboratoryInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const FhirLaboratorySchema = new mongoose.Schema(
  {
    encounterId: { type: String, required: true },
    labName: { type: String },
    pmrLabUuid: { type: String },
    display: { type: String },
    category: { type: String },
    type: { type: String },
    loincName: { type: String },
    loincCode: { type: String},
    specimenName: { type: String },
    specimenCode: { type: String},
    detail: { type: Object },
    createdAt: { type: Date},
    active: { type: Boolean},
    isFinished: { type: Boolean},
    isCito: { type: Boolean},
    fhirRequest:  { type: Object },
    fhirDiagnosticLabId: { type: String },
    fhirResponse: { type: Object },
    fhirResourceType:{ type: String },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

FhirLaboratorySchema.pre("save", async function (next) {
  return next();
});

const FhirLaboratoryModel = mongoose.model<FhirLaboratoryDocument>(
  "Fhir_Laboratory",
  FhirLaboratorySchema
);

export default FhirLaboratoryModel;
