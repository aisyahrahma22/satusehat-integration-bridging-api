import mongoose from "mongoose";

export interface FhirPractitionerReferenceInput {
  groupId: string;
  hospitalId: string;
  source: string;
  referenceId: string;
  fhirPractitionerId: string;
  active: boolean;
}

export interface FhirPractitionerReferenceDocument extends FhirPractitionerReferenceInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const FhirPractitionerReferenceSchema = new mongoose.Schema(
  {
    groupId: { type: String, required: true },
    hospitalId: { type: String, required: true },
    source: { type: String, enum: ['doctor', 'nurse', 'user'], required: true },
    referenceId: { type: String, required: true },
    fhirPractitionerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Fhir_Practitioner" },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

FhirPractitionerReferenceSchema.pre("save", async function (next) {
  return next();
});

const FhirPractitionerReferenceModel = mongoose.model<FhirPractitionerReferenceDocument>(
  "Fhir_Practitioner_Reference",
  FhirPractitionerReferenceSchema
);

export default FhirPractitionerReferenceModel;
