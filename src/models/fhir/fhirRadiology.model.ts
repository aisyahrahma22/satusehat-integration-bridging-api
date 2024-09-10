import mongoose from "mongoose";

export interface FhirRadiologyInput {
  encounterId: string;
  fhirDiagnosticRadId: string;
  pmrRadUuid: string;
  description: string
}

export interface FhirRadiologyDocument extends FhirRadiologyInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const FhiRadiologySchema = new mongoose.Schema(
  {
    encounterId: { type: String, required: true },
    radName: { type: String },
    pmrRadUuid: { type: String },
    display: { type: String },
    system: { type: String },
    category: { type: String },
    loincName: { type: String },
    loincCode: { type: String},
    result: { type: String },
    createdAt: { type: Date},
    active: { type: Boolean},
    isFinished: { type: Boolean},
    isCito: { type: Boolean},
    fhirRequest:  { type: Object },
    fhirDiagnosticRadId: { type: String },
    fhirResponse: { type: Object },
    fhirResourceType:{ type: String },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

FhiRadiologySchema.pre("save", async function (next) {
  return next();
});

const FhiRadiologyModel = mongoose.model<FhirRadiologyDocument>(
  "Fhir_Radiology",
  FhiRadiologySchema
);

export default FhiRadiologyModel;
