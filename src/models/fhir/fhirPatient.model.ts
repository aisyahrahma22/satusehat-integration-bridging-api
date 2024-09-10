import mongoose from "mongoose";

export interface FhirPatientInput {
  identityNumber: string;
  identityType: string;
  fhirId: string;
  active: boolean;
  consent: any;
}

export interface FhirPatientIsBabyInput {
  isBaby: boolean,
  fhirMultipleBirthInteger: number
}

export interface FhirPatientDocument extends FhirPatientInput, FhirPatientIsBabyInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}
const consentItemSchema = new mongoose.Schema(
  {
      agent: { type: String },
      action: { type: String },
      fhirRequest: { type: Object },
      fhirResponse: { type: Object },
      fhirConsentId: { type: String },
      fhirResourceType:{type: String},
  },
  { _id: false }
);

const FhirPatientSchema = new mongoose.Schema(
  {
    identityNumber: { type: String, required: true },
    identityType: { type: String, required: true },
    fhirId: { type: String, required: true, unique: true },
    fhirName: { type: String },
    fhirGender: { type: String },
    fhirMeta: { type: Object },
    fhirResourceType: { type: String },
    active: { type: Boolean, default: true },
    consent: { type: consentItemSchema },
    isBaby: { type: Boolean },
    fhirMultipleBirthInteger: { type: Number },
  },
  {
    timestamps: true,
  }
);

FhirPatientSchema.pre("save", async function (next) {
  return next();
});

const FhirPatientModel = mongoose.model<FhirPatientDocument>(
  "Fhir_Patient",
  FhirPatientSchema
);

export default FhirPatientModel;
