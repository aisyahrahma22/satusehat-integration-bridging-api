import mongoose from "mongoose";

export interface FhirSpecimenInput {
  refId: string;
  fhirSpecimenId: string;
  fhirResponse: any
}

export interface FhirSpecimenDocument extends FhirSpecimenInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const FhirSpecimenSchema = new mongoose.Schema(
  {
    refId: { type: String, required: true },
    fhirRequest:  { type: Object },
    fhirSpecimenId: { type: String },
    fhirResponse: { type: Object },
    fhirResourceType:{ type: String },
    active: { type: Boolean},
  },
  {
    timestamps: true,
  }
);

FhirSpecimenSchema.pre("save", async function (next) {
  return next();
});

const FhirSpecimenModel = mongoose.model<FhirSpecimenDocument>(
  "Fhir_Specimen",
  FhirSpecimenSchema
);

export default FhirSpecimenModel;
