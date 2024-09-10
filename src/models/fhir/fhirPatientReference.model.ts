import mongoose from "mongoose";

export interface FhirPatientReferenceInput {
  groupId: string;
  hospitalId: string;
  patientId: string;
  fhirPatientId: string;
  active: boolean;
}

export interface FhirPatientReferenceDocument extends FhirPatientReferenceInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const FhirPatientReferenceSchema = new mongoose.Schema(
  {
    groupId: { type: String, required: true },
    hospitalId: { type: String, required: true },
    patientId: { type: String, required: true },
    fhirPatientId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Fhir_Patient" },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

FhirPatientReferenceSchema.pre("save", async function (next) {
  return next();
});

const FhirPatientReferenceModel = mongoose.model<FhirPatientReferenceDocument>(
  "Fhir_Patient_Reference",
  FhirPatientReferenceSchema
);

export default FhirPatientReferenceModel;
