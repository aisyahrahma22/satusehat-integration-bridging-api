import mongoose from "mongoose";

export interface FhirPractitionerInput {
  identityNumber: string;
  fhirId: string;
  fhirName: string;
  fhirPrefixName: string;
  fhirSuffixName: string;
  fhirGender: string;
  fhirMeta: string;
  fhirResourceType: string;
  active: boolean;
}

export interface FhirPractitionerDocument extends FhirPractitionerInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const FhirPractitionerSchema = new mongoose.Schema(
  {
    identityNumber: { type: String, required: true, unique: true },
    fhirId: { type: String, required: true, unique: true },
    fhirName: { type: String, required: true },
    fhirPrefixName: { type: String },
    fhirSuffixName: { type: String },
    fhirGender: { type: String },
    fhirMeta: { type: Object },
    fhirResourceType: { type: String },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

FhirPractitionerSchema.pre("save", async function (next) {
  return next();
});

const FhirPractitionerModel = mongoose.model<FhirPractitionerDocument>(
  "Fhir_Practitioner",
  FhirPractitionerSchema
);

export default FhirPractitionerModel;
