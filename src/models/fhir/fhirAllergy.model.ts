import mongoose from "mongoose";

export interface FhirAllergyInput {
  encounterId: string;
  fhirAllergyId: string;
  pmrAllergyId: string;
  description: string;
}

export interface FhirAllergyDocument extends FhirAllergyInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const FhirAllergySchema = new mongoose.Schema(
  {
    encounterId: { type: String, required: true },
    name: { type: String },
    code: { type: Number},
    category: { type: String },
    notes: { type: String },
    createdAt: { type: Date},
    active: { type: Boolean},
    pmrAllergyId: { type: String },
    fhirRequest:  { type: Object },
    fhirAllergyId: { type: String },
    fhirResponse: { type: Object },
    fhirResourceType:{ type: String },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

FhirAllergySchema.pre("save", async function (next) {
  return next();
});

const FhirAllergyModel = mongoose.model<FhirAllergyDocument>(
  "Fhir_Allergy",
  FhirAllergySchema
);

export default FhirAllergyModel;
