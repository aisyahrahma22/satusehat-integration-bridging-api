import mongoose from "mongoose";

export interface FhirEncounterDuplicateInput {
  encounterId: string;
  active: boolean
}

export interface FhirEncounterDuplicateDocument extends FhirEncounterDuplicateInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const FhirEncounterDuplicateSchema = new mongoose.Schema(
  {
    encounterId: { type: String, required: true },
    active: { type: Boolean, default: true }
  },
  {
    timestamps: true,
  }
);

FhirEncounterDuplicateSchema.pre("save", async function (next) {
  return next();
});

const FhirEncounterDuplicateModel = mongoose.model<FhirEncounterDuplicateDocument>(
  "Fhir_Encounter_Duplicate",
  FhirEncounterDuplicateSchema
);

export default FhirEncounterDuplicateModel;