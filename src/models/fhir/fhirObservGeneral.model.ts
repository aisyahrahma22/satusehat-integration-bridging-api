import mongoose from "mongoose";

export interface FhirObservGeneralInput {
  fhirObservGeneralId: string,
  refId: string
}

export interface FhirObservGeneralDocument extends FhirObservGeneralInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const FhirObservGeneralSchema = new mongoose.Schema(
  {
    refId: { type: String, required: true },
    fhirRequest: { type: Object },
    fhirResponse: { type: Object },
    fhirObservGeneralId: { type: String },
    fhirResourceType:{type: String},
    active: { type: Boolean, default: true },
    category: { type: String, enum: ['lab', 'rad'], required: true },
  },
  {
    timestamps: true,
  }
);

FhirObservGeneralSchema.pre("save", async function (next) {
  return next();
});

const FhirObservGeneralModel = mongoose.model<FhirObservGeneralDocument>(
  "Fhir_ObservGeneral",
  FhirObservGeneralSchema
);

export default FhirObservGeneralModel;
